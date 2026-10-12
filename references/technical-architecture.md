# Referencia Técnica — Servicios BackEnd

> **Versión:** 2.0
> **Stack:** Node.js 22+ · Express 5 · TypeScript 5+ · PostgreSQL 17 · JWT · Docker
> **Propósito:** Documento de referencia técnica para desarrolladores. Explica la arquitectura por capas, decisiones de diseño, contratos de datos unificados con el frontend (`frontend_manager`), seguridad y patrones de implementación.

---

## Tabla de Contenidos

1. [Visión General y Arquitectura](#1-visión-general-y-arquitectura)
2. [Creación del Proyecto](#2-creación-del-proyecto)
3. [Configuración de TypeScript](#3-configuración-de-typescript)
4. [Dependencias y Decisiones Técnicas](#4-dependencias-y-decisiones-técnicas)
5. [Variables de Entorno y Seguridad](#5-variables-de-entorno-y-seguridad)
6. [Estructura de Directorios](#6-estructura-de-directorios)
7. [Configuración Centralizada (config.ts)](#7-configuración-centralizada-configts)
8. [Logger (Pino)](#8-logger-pino)
9. [Base de Datos (PostgreSQL Pool)](#9-base-de-datos-postgresql-pool)
10. [Interfaces y Contratos de Datos](#10-interfaces-y-contratos-de-datos)
11. [Seguridad](#11-seguridad)
    - 11.1 [Principios Generales](#111-principios-generales)
    - 11.2 [Helmet y Security Headers](#112-helmet-y-security-headers)
    - 11.3 [Rate Limiting](#113-rate-limiting)
    - 11.4 [CORS](#114-cors)
    - 11.5 [Validación y Sanitización (Zod)](#115-validación-y-sanitización-zod)
    - 11.6 [Protección contra Ataques Comunes](#116-protección-contra-ataques-comunes)
12. [Autenticación y Autorización](#12-autenticación-y-autorización)
    - 12.1 [Estrategia de Tokens](#121-estrategia-de-tokens)
    - 12.2 [Generación y Verificación de JWT](#122-generación-y-verificación-de-jwt)
    - 12.3 [Middlewares de Autenticación y Roles](#123-middlewares-de-autenticación-y-roles)
    - 12.4 [Rotación de Refresh Tokens](#124-rotación-de-refresh-tokens)
    - 12.5 [Revocación y Blacklisting](#125-revocación-y-blacklisting)
13. [Flujo de Sesiones y Compatibilidad Frontend](#13-flujo-de-sesiones-y-compatibilidad-frontend)
14. [Middlewares](#14-middlewares)
    - 14.1 [Error Handler Centralizado](#141-error-handler-centralizado)
    - 14.2 [Not Found Handler](#142-not-found-handler)
    - 14.3 [Request Logger con Trazabilidad](#143-request-logger-con-trazabilidad)
15. [Routers (Rutas y Endpoints)](#15-routers-rutas-y-endpoints)
16. [Controllers (Controladores)](#16-controllers-controladores)
17. [Services (Capa de Servicio)](#17-services-capa-de-servicio)
18. [Models (Capa de Acceso a Datos)](#18-models-capa-de-acceso-a-datos)
19. [Queries](#19-queries)
20. [Schemas de Validación (Zod)](#20-schemas-de-validación-zod)
21. [Utilidades](#21-utilidades)
22. [Archivos Principales (app.ts y server.ts)](#22-archivos-principales-appts-y-serverts)
23. [Stored Procedures en PostgreSQL](#23-stored-procedures-en-postgresql)
24. [Docker y Despliegue](#24-docker-y-despliegue)
25. [Testing](#25-testing)
26. [Scripts de Ejecución](#26-scripts-de-ejecución)
27. [Checklist Pre-Deploy y Estructura Final](#27-checklist-pre-deploy-y-estructura-final)

---

## 1. Visión General y Arquitectura

El ecosistema BackEnd está compuesto por servicios modulares orientados a responsabilidades únicas. Cada microservicio utiliza el prefijo canónico `api-`:

| Servicio             | Responsabilidad                                                     |
| -------------------- | ------------------------------------------------------------------- |
| `api`                | API Gateway central, orquestación de servicios y acceso principal a BD |
| `api-files`          | Almacenamiento, streaming y procesamiento de archivos (S3/disco)   |
| `api-pdf`            | Generación, lectura y modificación de documentos PDF                |
| `api-email`          | Plantillas y despacho de correos transaccionales                    |
| `api-webhook-[type]` | Consumo y procesamiento de webhooks de terceros                     |
| `api-auth`           | Servicio dedicado de autenticación federada o SSO (si aplica)       |

> **Regla de Integración:** Las aplicaciones frontend desarrolladas bajo `frontend_manager` se comunican **exclusivamente con el servicio central `api`**, el cual actúa como API Gateway y distribuye internamente a los servicios satélites.

### Arquitectura Unidireccional por Capas

```
Request → Router → Middleware(s) → Controller → Service → Model → Query → PostgreSQL (SP)
                                                                            ↓
Response ← Controller ← Service ← Model ← rows[0].data ────────────────────┘
```

| Capa | Ubicación | Responsabilidad Única |
|---|---|---|
| **Router** | `src/routers/{entity}.ts` | Declara endpoints y encadena middlewares de seguridad y validación. |
| **Middleware** | `src/middlewares/*.ts` | Autenticación, autorización, validación de schemas, headers y logging. |
| **Controller** | `src/controllers/{entity}.ts` | Adaptador HTTP puro. Extrae datos del request, delega al service y responde con `sendResponse`. No contiene lógica de dominio. |
| **Service** | `src/services/{entity}.ts` | Lógica de negocio, reglas de dominio, orquestación y lanzamiento de excepciones estructuradas. |
| **Model** | `src/models/{entity}.ts` | Ejecución de queries hacia la BD. Invoca Stored Procedures y retorna `result.rows[0].data`. |
| **Query** | `src/queries/{entity}.ts` | Declaración de llamadas SQL a Stored Procedures en el esquema `app`. |
| **Schema** | `src/schemas/{entity}.ts` | Esquemas Zod para validación y sanitización estricta de entradas. |

---

## 2. Creación del Proyecto

```bash
mkdir api-<nombre>
cd api-<nombre>
yarn init -y
```

---

## 3. Configuración de TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

> Se utiliza `module: "NodeNext"` y `moduleResolution: "NodeNext"`, garantizando soporte nativo para ECMAScript Modules (ESM) y resolución moderna de paquetes en Node.js 22+.

---

## 4. Dependencias y Decisiones Técnicas

### Producción

```bash
yarn add express@^5.1 cors helmet dotenv pg zod pino pino-pretty \
  @node-rs/bcrypt jsonwebtoken express-rate-limit hpp cookie-parser
```

### Desarrollo

```bash
yarn add -D typescript @types/node @types/express @types/cors @types/pg \
  @types/jsonwebtoken @types/cookie-parser \
  tsx vitest @vitest/coverage-v8 supertest @types/supertest
```

### Tabla de Decisiones Técnicas

| Paquete | Elección Actual | Por qué se adoptó |
| :--- | :--- | :--- |
| **Express 5** | `express@^5.1` | Manejo nativo de promesas en rutas asíncronas (errores no capturados van directo a `next(err)`). Router moderno y seguro. |
| **Tooling Dev** | `tsx` | Reemplaza a `ts-node-dev`. Basado en `esbuild`, arranque instantáneo, soporte nativo de TypeScript 5 y ESM sin desincronización. |
| **Hashing** | `@node-rs/bcrypt` | Hashing implementado en Rust. 10x-20x más rápido que `bcryptjs`, sin bloqueo prolongado del Event Loop y sin requerir Python/node-gyp. |
| **UUID** | Nativo (`crypto.randomUUID`) | Eliminada la dependencia `uuid`. Node 20+ incluye generación nativa de UUID v4 criptográficamente seguros. |
| **Logger** | `pino` + `pino-pretty` | Salida JSON nativa de alto rendimiento con formateador para desarrollo y soporte de enmascaramiento (`redact`). |
| **Testing** | `vitest` + `supertest` | Ejecución de pruebas ultra rápida con soporte nativo de TypeScript y compatibilidad de mocks en ESM. |

---

## 5. Variables de Entorno y Seguridad

### `.env` (Raíz del proyecto)

```bash
# ─── Aplicación ───
NODE_ENV=development
API_NAME=api
API_PORT=3001
API_VERSION=v1

# ─── Base de Datos ───
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=password
DB_POOL_MAX=20
DB_SSL=false

# ─── JWT ───
JWT_ACCESS_SECRET=clave_secreta_minimo_64_caracteres_aleatorios_para_access_token
JWT_REFRESH_SECRET=clave_secreta_minimo_64_caracteres_aleatorios_para_refresh_token
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
JWT_ISSUER=api-core

# ─── Service-to-Service ───
API_KEY=clave_secreta_para_comunicacion_entre_microservicios

# ─── CORS ───
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ─── Rate Limiting ───
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Generación de Claves Seguras:**
> Para generar secretos criptográficos en terminal:
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## 6. Estructura de Directorios

```
api-<nombre>/
├── src/
│   ├── interfaces/        # Contratos TypeScript
│   │   ├── auth.ts            # JwtPayload, TokenPair
│   │   ├── response.ts        # ApiResponse<T>, PaginatedResult<T>
│   │   └── models/            # Interfaces de entidades (user.ts, etc.)
│   ├── middlewares/       # Middlewares Express
│   │   ├── auth.ts            # Verificación de JWT y roles
│   │   ├── cors.ts            # Configuración CORS
│   │   ├── errorHandler.ts    # Captura centralizada de excepciones
│   │   ├── notFoundHandler.ts # Rutas 404
│   │   ├── rateLimiter.ts     # Limitación de tasa general y auth
│   │   ├── requestLogger.ts   # Log con X-Request-ID
│   │   ├── securityHeaders.ts # Helmet y CSP estricto
│   │   └── validateRequest.ts # Validación Zod
│   ├── routers/           # Enrutamiento de endpoints
│   │   ├── index.ts           # Router raíz (/api/v1)
│   │   ├── auth.ts            # /api/v1/auth
│   │   └── {entity}.ts        # /api/v1/{entity}
│   ├── controllers/       # Adaptadores HTTP (1 línea por método)
│   │   ├── auth.ts
│   │   └── {entity}.ts
│   ├── services/          # Reglas de negocio y excepciones
│   │   ├── auth.ts
│   │   └── {entity}.ts
│   ├── models/            # Interacción con PostgreSQL (rows[0].data)
│   │   └── {entity}.ts
│   ├── queries/           # Invocaciones SQL a stored procedures
│   │   └── {entity}.ts
│   ├── schemas/           # Esquemas de validación Zod
│   │   ├── auth.ts
│   │   └── {entity}.ts
│   ├── utils/             # Clientes e infraestructura
│   │   ├── config.ts          # Lectura de variables de entorno
│   │   ├── database.ts        # Pool pg y testConnection()
│   │   ├── errors.ts          # Jerarquía AppError
│   │   ├── jwt.ts             # Sign & Verify JWT
│   │   ├── logger.ts          # Instancia Pino
│   │   └── sendResponse.ts    # Formato unificado de respuesta
│   ├── app.ts             # Configuración de Express
│   └── server.ts          # Entrada principal y Graceful Shutdown
├── tests/
│   ├── unit/
│   └── integration/
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 7. Configuración Centralizada (config.ts)

```typescript
// src/utils/config.ts
import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Variable de entorno requerida no encontrada: ${key}`);
  }
  return value;
}

const config = {
  // Aplicación
  nodeEnv: requireEnv("NODE_ENV", "development"),
  apiName: requireEnv("API_NAME", "api"),
  apiPort: parseInt(requireEnv("API_PORT", "3001"), 10),
  apiVersion: requireEnv("API_VERSION", "v1"),
  isDev: process.env.NODE_ENV !== "production",

  // Base de Datos
  db: {
    host: requireEnv("DB_HOST", "localhost"),
    port: parseInt(requireEnv("DB_PORT", "5432"), 10),
    name: requireEnv("DB_NAME", "postgres"),
    user: requireEnv("DB_USER", "postgres"),
    password: requireEnv("DB_PASSWORD"),
    poolMax: parseInt(requireEnv("DB_POOL_MAX", "20"), 10),
    ssl: requireEnv("DB_SSL", "false") === "true",
  },

  // JWT
  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiration: requireEnv("JWT_ACCESS_EXPIRATION", "15m"),
    refreshExpiration: requireEnv("JWT_REFRESH_EXPIRATION", "7d"),
    issuer: requireEnv("JWT_ISSUER", "api-core"),
  },

  // Service to service
  apiKey: requireEnv("API_KEY", "default-dev-service-key"),

  // CORS
  corsAllowedOrigins: requireEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(requireEnv("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    maxRequests: parseInt(requireEnv("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  },
} as const;

export default config;
```

---

## 8. Logger (Pino)

```typescript
// src/utils/logger.ts
import pino from "pino";
import config from "./config";

const logger = pino({
  level: config.isDev ? "debug" : "info",
  transport: config.isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: config.apiName,
    env: config.nodeEnv,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-api-key']",
      "req.body.password",
      "*.password",
      "*.token",
      "*.refreshToken",
    ],
    casing: "all",
  },
});

export default logger;
```

---

## 9. Base de Datos (PostgreSQL Pool)

```typescript
// src/utils/database.ts
import pg from "pg";
import config from "./config";
import logger from "./logger";

const { Pool } = pg;

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  options: "-c timezone=America/Santiago",
  ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
});

pool.on("connect", () => {
  logger.info("Nueva conexión establecida en el pool de PostgreSQL");
});

pool.on("error", (err) => {
  logger.error({ err }, "Error inesperado en cliente PostgreSQL inactivo");
});

export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    logger.info("Conexión a PostgreSQL verificada exitosamente");
  } catch (err) {
    logger.fatal({ err }, "Fallo crítico al conectar a PostgreSQL");
    process.exit(1);
  }
}

export default pool;
```

---

## 10. Interfaces y Contratos de Datos

Para asegurar **paridad total con `frontend_manager`**, el backend estructura sus respuestas bajo estos tipos genéricos:

```typescript
// src/interfaces/response.ts

/**
 * Contrato estándar de respuesta devuelto al cliente HTTP
 * Espejo de IDataResponse en el frontend
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
  details?: unknown;
  requestId?: string;
}

/**
 * Contrato para respuestas de colecciones o listados (getAll)
 * Garantiza compatibilidad con response.data.data y response.data.total del Store
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
```

```typescript
// src/interfaces/auth.ts
export interface JwtPayload {
  sub: string; // ID del usuario
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  tokens: TokenPair;
}
```

```typescript
// src/interfaces/models/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "editor";
  status: "active" | "inactive";
  passwordHash?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
```

---

## 11. Seguridad

### 11.1 Principios Generales
Toda interacción se rige por el principio de **defensa en profundidad**:
1. Validación estricta y desinfección de entrada con Zod.
2. Cabeceras HTTP endurecidas vía Helmet (CSP estricto sin inline scripts).
3. Hashing de contraseñas mediante `@node-rs/bcrypt` (factor de costo 12).
4. Consultas parametrizadas en Stored Procedures (prevención total de SQL Injection).
5. Rate Limiting general y restrictivo para autenticación.

### 11.2 Helmet y Security Headers

```typescript
// src/middlewares/securityHeaders.ts
import helmet from "helmet";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  noSniff: true,
  xssFilter: false,
  frameguard: { action: "deny" },
});
```

### 11.3 Rate Limiting

```typescript
// src/middlewares/rateLimiter.ts
import rateLimit from "express-rate-limit";
import config from "../utils/config";

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: "Demasiadas peticiones. Intente nuevamente más tarde.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // 10 intentos
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    data: null,
    error: "Demasiados intentos fallidos. Intente en 15 minutos.",
  },
});
```

### 11.4 CORS

```typescript
// src/middlewares/cors.ts
import cors from "cors";
import config from "../utils/config";
import logger from "../utils/logger";

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (config.corsAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, "Petición bloqueada por CORS");
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204,
});
```

### 11.5 Validación y Sanitización (Zod)

El middleware extrae un mensaje condensado y legible en `error` para no romper la interfaz del frontend, e inyecta el arreglo de campos en `details`:

```typescript
// src/middlewares/validateRequest.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type RequestLocation = "body" | "params" | "query";

export function validateRequest(
  schema: ZodSchema,
  location: RequestLocation = "body",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[location]);
      req[location] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        const summary = issues.map((i) => `${i.field}: ${i.message}`).join(", ");

        res.status(400).json({
          success: false,
          data: null,
          error: `Error de validación: ${summary}`,
          details: issues,
        });
        return;
      }
      next(error);
    }
  };
}
```

### 11.6 Protección contra Ataques Comunes

```typescript
// En app.ts:
import hpp from "hpp";
import express from "express";

app.use(express.json({ limit: "10kb" })); // Prevención DoS por payloads grandes
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(hpp()); // HTTP Parameter Pollution
```

---

## 12. Autenticación y Autorización

### 12.1 Estrategia de Tokens
Se utiliza el esquema estándar de **Dual Token**:
* **Access Token:** Corta duración (15 min). Se envía en cada petición mediante el encabezado `Authorization: Bearer <token>`.
* **Refresh Token:** Larga duración (7 días). Se utiliza exclusivamente contra `/api/v1/auth/refresh` para emitir un nuevo par de tokens.
* **Almacenamiento:** Compatible con almacenamiento en memoria/`localStorage` en el cliente (como consume el interceptor de Axios en `frontend_manager`) y compatible con cookies seguras en caso de requerirse.

### 12.2 Generación y Verificación de JWT

```typescript
// src/utils/jwt.ts
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "./config";
import { JwtPayload, TokenPair } from "../interfaces/auth";

const { jwt: jwtConfig } = config;

export function generateTokenPair(
  payload: Omit<JwtPayload, "iat" | "exp" | "iss" | "jti">,
): TokenPair {
  const accessTokenId = crypto.randomUUID();
  const refreshTokenId = crypto.randomUUID();

  const accessToken = jwt.sign(
    { ...payload, jti: accessTokenId },
    jwtConfig.accessSecret,
    {
      expiresIn: jwtConfig.accessExpiration,
      issuer: jwtConfig.issuer,
      subject: payload.sub,
      algorithm: "HS256",
    },
  );

  const refreshToken = jwt.sign(
    { sub: payload.sub, jti: refreshTokenId },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiration,
      issuer: jwtConfig.issuer,
      subject: payload.sub,
      algorithm: "HS256",
    },
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, jwtConfig.accessSecret, {
    issuer: jwtConfig.issuer,
    algorithms: ["HS256"],
  }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, jwtConfig.refreshSecret, {
    issuer: jwtConfig.issuer,
    algorithms: ["HS256"],
  }) as JwtPayload;
}
```

### 12.3 Middlewares de Autenticación y Roles

```typescript
// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { JwtPayload } from "../interfaces/auth";
import config from "../utils/config";
import logger from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      data: null,
      error: "Token de autenticación no proporcionado",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "TokenExpiredError"
        ? "Token expirado"
        : "Token inválido";

    logger.warn({ ip: req.ip }, `Autenticación fallida: ${message}`);
    res.status(401).json({
      success: false,
      data: null,
      error: message,
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, data: null, error: "No autenticado" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user.sub, role: req.user.role, required: allowedRoles },
        "Acceso denegado: rol insuficiente",
      );
      res.status(403).json({
        success: false,
        data: null,
        error: "No tiene permisos para acceder a este recurso",
      });
      return;
    }

    next();
  };
}

export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey || apiKey !== config.apiKey) {
    res.status(401).json({
      success: false,
      data: null,
      error: "API key inválida o no proporcionada",
    });
    return;
  }

  next();
}
```

### 12.4 Rotación de Refresh Tokens

```typescript
// src/services/auth.ts
import { hash, compare } from "@node-rs/bcrypt";
import pool from "../utils/database";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";
import { TokenPair, JwtPayload } from "../interfaces/auth";
import { UnauthorizedError } from "../utils/errors";
import logger from "../utils/logger";

const SALT_ROUNDS = 12;

export async function login(email: string, password: string): Promise<TokenPair> {
  const result = await pool.query(
    "SELECT id, email, password_hash, role, status FROM app.users WHERE email = $1 AND deleted_at IS NULL",
    [email],
  );

  if (result.rowCount === 0) {
    await hash(password, SALT_ROUNDS); // Mitigación de timing attacks
    throw new UnauthorizedError("Credenciales inválidas");
  }

  const user = result.rows[0];
  if (user.status !== "active") {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  const isValid = await compare(password, user.password_hash);
  if (!isValid) {
    throw new UnauthorizedError("Credenciales inválidas");
  }

  const tokenPair = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshHash = await hash(tokenPair.refreshToken, 10);
  await pool.query(
    `INSERT INTO app.refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshHash],
  );

  return tokenPair;
}

export async function refreshTokens(currentRefreshToken: string): Promise<TokenPair> {
  let decoded: JwtPayload;
  try {
    decoded = verifyRefreshToken(currentRefreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido o expirado");
  }

  const result = await pool.query(
    "SELECT id, token_hash FROM app.refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()",
    [decoded.sub],
  );

  let matchedTokenId: string | null = null;
  for (const row of result.rows) {
    if (await compare(currentRefreshToken, row.token_hash)) {
      matchedTokenId = row.id;
      break;
    }
  }

  if (!matchedTokenId) {
    logger.error({ userId: decoded.sub }, "Reuso de refresh token detectado: revocando tokens");
    await pool.query(
      "UPDATE app.refresh_tokens SET revoked_at = NOW() WHERE user_id = $1",
      [decoded.sub],
    );
    throw new UnauthorizedError("Sesión invalidada por seguridad");
  }

  // Revocar token consumido
  await pool.query(
    "UPDATE app.refresh_tokens SET revoked_at = NOW() WHERE id = $1",
    [matchedTokenId],
  );

  const userResult = await pool.query(
    "SELECT id, email, role, status FROM app.users WHERE id = $1 AND deleted_at IS NULL",
    [decoded.sub],
  );

  if (userResult.rowCount === 0 || userResult.rows[0].status !== "active") {
    throw new UnauthorizedError("Usuario no disponible");
  }

  const user = userResult.rows[0];
  const newTokenPair = generateTokenPair({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const newRefreshHash = await hash(newTokenPair.refreshToken, 10);
  await pool.query(
    `INSERT INTO app.refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, newRefreshHash],
  );

  return newTokenPair;
}
```

---

## 13. Flujo de Sesiones y Compatibilidad Frontend

```
┌─────────────────────┐                                     ┌─────────────────────┐
│  Frontend (Next.js) │                                     │  Backend (Express)  │
└──────────┬──────────┘                                     └──────────┬──────────┘
           │  POST /api/v1/auth/login                                  │
           │  { email, password }                                      │
           │──────────────────────────────────────────────────────────>│
           │                                                           │
           │  200 OK: { success: true, data: { accessToken, ... } }    │
           │<──────────────────────────────────────────────────────────│
           │  (Guarda token en memory / localStorage)                  │
           │                                                           │
           │  GET /api/v1/entity/getAll                                │
           │  Authorization: Bearer <accessToken>                      │
           │──────────────────────────────────────────────────────────>│
           │                                                           │
           │  200 OK: { success: true, data: { data: [], total: 0 } }  │
           │<──────────────────────────────────────────────────────────│
           │                                                           │
           │  [Access token expira -> 401 Unauthorized]                │
           │                                                           │
           │  POST /api/v1/auth/refresh                                │
           │  { refreshToken }                                         │
           │──────────────────────────────────────────────────────────>│
           │                                                           │
           │  200 OK: Nuevo par { accessToken, refreshToken }          │
           │<──────────────────────────────────────────────────────────│
```

---

## 14. Middlewares

### 14.1 Error Handler Centralizado

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso") {
    super(`${resource} no encontrado`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Datos de entrada inválidos") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acceso denegado") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "El recurso ya existe") {
    super(message, 409);
  }
}
```

```typescript
// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.fatal({ err, url: req.originalUrl, method: req.method }, "Error crítico no operacional");
    } else {
      logger.warn({ err: err.message, statusCode: err.statusCode, url: req.originalUrl });
    }

    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }

  logger.fatal({ err, url: req.originalUrl, method: req.method }, "Excepción no controlada");

  res.status(500).json({
    success: false,
    data: null,
    error: "Error interno del servidor",
  });
}
```

### 14.2 Not Found Handler

```typescript
// src/middlewares/notFoundHandler.ts
import { Request, Response } from "express";
import logger from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn({ url: req.originalUrl, method: req.method }, "Ruta no encontrada");

  res.status(404).json({
    success: false,
    data: null,
    error: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
}
```

### 14.3 Request Logger con Trazabilidad

```typescript
// src/middlewares/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import logger from "../utils/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);

  const start = Date.now();

  res.on("finish", () => {
    const duration = `${Date.now() - start}ms`;
    const payload = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn(payload, "Request finalizado con error");
    } else {
      logger.info(payload, "Request finalizado con éxito");
    }
  });

  next();
}
```

---

## 15. Routers (Rutas y Endpoints)

Para mantener paridad total con los servicios de Axios definidos en `frontend_manager`, cada recurso expone:

| Endpoint | Método | Middleware | Descripción |
| :--- | :--- | :--- | :--- |
| `/getAll` | GET | `authenticate` | Retorna lista y total `{ data: T[], total: number }` |
| `/getById/:id` | GET | `authenticate` | Retorna una entidad por UUID |
| `/create` | POST | `authenticate`, `validateRequest` | Inserta una nueva entidad |
| `/update/:id` | PUT | `authenticate`, `validateRequest` | Actualiza una entidad existente |
| `/delete/:id` | DELETE | `authenticate` | Elimina lógicamente por UUID |

```typescript
// src/routers/{entity}.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { createAreaSchema, updateAreaSchema } from "../schemas/area";
import * as AreaController from "../controllers/area";

const router = Router();

router.get("/getAll", authenticate, AreaController.getAll);
router.get("/getById/:id", authenticate, AreaController.getById);
router.post("/create", authenticate, validateRequest(createAreaSchema), AreaController.create);
router.put("/update/:id", authenticate, validateRequest(updateAreaSchema), AreaController.update);
router.delete("/delete/:id", authenticate, AreaController.remove);

export default router;
```

```typescript
// src/routers/auth.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimiter";
import { validateRequest } from "../middlewares/validateRequest";
import { loginSchema, refreshSchema } from "../schemas/auth";
import * as AuthController from "../controllers/auth";

const router = Router();

router.post("/login", authLimiter, validateRequest(loginSchema), AuthController.login);
router.post("/refresh", validateRequest(refreshSchema), AuthController.refresh);
router.post("/logout", authenticate, AuthController.logout);
router.get("/me", authenticate, AuthController.me);

export default router;
```

---

## 16. Controllers (Controladores)

Los controladores son **adaptadores HTTP puros** de una sola línea de acción. Delegan directamente a la capa de servicio y emiten la respuesta con `sendResponse`.

```typescript
// src/controllers/{entity}.ts
import { Request, Response, NextFunction } from "express";
import * as AreaService from "../services/area";
import { sendResponse } from "../utils/sendResponse";

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const result = await AreaService.getAll(); sendResponse(req, res, result); } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await AreaService.getById(req.params.id as string); sendResponse(req, res, item); } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await AreaService.create(req.body); sendResponse(req, res, item, 201); } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const item = await AreaService.update(req.params.id as string, req.body); sendResponse(req, res, item, 200); } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const result = await AreaService.remove(req.params.id as string); sendResponse(req, res, result); } catch (err) { next(err); }
}
```

---

## 17. Services (Capa de Servicio)

Concentra las **reglas de negocio, orquestación y validaciones de dominio**. Nunca importa elementos de transporte (`req`, `res`, `express`).

```typescript
// src/services/{entity}.ts
import * as AreaModel from "../models/area";
import { NotFoundError } from "../utils/errors";
import { PaginatedResult } from "../interfaces/response";
import { Area } from "../interfaces/models/area";
import { CreateAreaInput, UpdateAreaInput } from "../schemas/area";

export async function getAll(): Promise<PaginatedResult<Area>> {
  return AreaModel.getAll();
}

export async function getById(id: string): Promise<Area> {
  const item = await AreaModel.getById(id);
  if (!item) throw new NotFoundError("Área");
  return item;
}

export async function create(data: CreateAreaInput): Promise<Area> {
  return AreaModel.create(data.name);
}

export async function update(id: string, data: UpdateAreaInput): Promise<Area> {
  const existing = await AreaModel.getById(id);
  if (!existing) throw new NotFoundError("Área");
  return AreaModel.update(id, data.name);
}

export async function remove(id: string): Promise<boolean> {
  const existing = await AreaModel.getById(id);
  if (!existing) throw new NotFoundError("Área");
  return AreaModel.remove(id);
}
```

---

## 18. Models (Capa de Acceso a Datos)

Los modelos ejecutan las consultas a PostgreSQL y retornan el campo serializado `result.rows[0].data`.

```typescript
// src/models/{entity}.ts
import pool from "../utils/database";
import * as queries from "../queries/area";
import { PaginatedResult } from "../interfaces/response";
import { Area } from "../interfaces/models/area";

export async function getAll(): Promise<PaginatedResult<Area>> {
  const result = await pool.query(queries.getAll);
  return result.rows[0]?.data ?? { data: [], total: 0 };
}

export async function getById(id: string): Promise<Area | null> {
  const result = await pool.query(queries.getById, [id]);
  return result.rows[0]?.data ?? null;
}

export async function create(name: string): Promise<Area> {
  const result = await pool.query(queries.create, [name]);
  return result.rows[0].data;
}

export async function update(id: string, name: string): Promise<Area> {
  const result = await pool.query(queries.update, [id, name]);
  return result.rows[0].data;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(queries.remove, [id]);
  return result.rows[0]?.data?.deleted ?? true;
}
```

---

## 19. Queries

```typescript
// src/queries/{entity}.ts
export const getAll = `SELECT app.area_get_all() AS data`;
export const getById = `SELECT app.area_get_by_id($1) AS data`;
export const create = `SELECT app.area_create($1) AS data`;
export const update = `SELECT app.area_update($1, $2) AS data`;
export const remove = `SELECT app.area_delete($1) AS data`;
```

---

## 20. Schemas de Validación (Zod)

```typescript
// src/schemas/{entity}.ts
import { z } from "zod";

export const createAreaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255).trim(),
});

export const updateAreaSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255).trim(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
```

```typescript
// src/schemas/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Formato de correo no válido").max(255).trim().toLowerCase(),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "El refresh token es requerido"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
```

---

## 21. Utilidades

```typescript
// src/utils/sendResponse.ts
import { Request, Response } from "express";

export function sendResponse<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode: number = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    error: null,
    requestId: req.headers["x-request-id"],
  });
}
```

---

## 22. Archivos Principales (app.ts y server.ts)

### `src/app.ts`

```typescript
// src/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import config from "./utils/config";
import { securityHeaders } from "./middlewares/securityHeaders";
import { corsMiddleware } from "./middlewares/cors";
import { generalLimiter } from "./middlewares/rateLimiter";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import apiRouter from "./routers";

const app = express();

// Middlewares de Infraestructura y Seguridad
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(generalLimiter);
app.use(hpp());

// Parseo de contenido
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());

// Trazabilidad
app.use(requestLogger);

// Health Check público
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Rutas versionadas de la API (/api/v1)
app.use(`/api/${config.apiVersion}`, apiRouter);

// Manejo centralizado de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

### `src/routers/index.ts` (Agrupador)

```typescript
// src/routers/index.ts
import { Router } from "express";
import authRouter from "./auth";
import areaRouter from "./area";

const router = Router();

router.use("/auth", authRouter);
router.use("/area", areaRouter);

export default router;
```

### `src/server.ts`

```typescript
// src/server.ts
import config from "./utils/config";
import logger from "./utils/logger";
import { testConnection } from "./utils/database";
import app from "./app";

async function startServer(): Promise<void> {
  await testConnection();

  const server = app.listen(config.apiPort, () => {
    logger.info(
      { port: config.apiPort, env: config.nodeEnv, version: config.apiVersion },
      `${config.apiName} iniciado correctamente`,
    );
  });

  const shutdown = async (signal: string) => {
    logger.info(`Señal ${signal} recibida. Procediendo a cierre graceful...`);

    server.close(async () => {
      logger.info("Servidor HTTP detenido");

      try {
        const pool = (await import("./utils/database")).default;
        await pool.end();
        logger.info("Pool de PostgreSQL cerrado correctamente");
      } catch (err) {
        logger.error({ err }, "Error cerrando pool de PostgreSQL");
      }

      process.exit(0);
    });

    setTimeout(() => {
      logger.fatal("Tiempo límite excedido para shutdown. Forzando terminación.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled Rejection detectada");
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught Exception detectada");
    process.exit(1);
  });
}

startServer();
```

---

## 23. Stored Procedures en PostgreSQL

Los Stored Procedures (o funciones PL/pgSQL) encapsulan el acceso y serializan el resultado directamente en `jsonb`.

```sql
-- Schema y tabla
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 1. Listar todos retornando { data, total } compatible con el frontend
CREATE OR REPLACE FUNCTION app.area_get_all()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb),
    'total', COUNT(*)
  )
  INTO v_result
  FROM (
    SELECT id, name, created_at, updated_at
    FROM app.areas
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  ) t;

  RETURN COALESCE(v_result, '{"data":[], "total": 0}'::jsonb);
END;
$$;

-- 2. Obtener por ID
CREATE OR REPLACE FUNCTION app.area_get_by_id(p_id UUID)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT to_jsonb(t) INTO v_result
  FROM (
    SELECT id, name, created_at, updated_at
    FROM app.areas
    WHERE id = p_id AND deleted_at IS NULL
  ) t;

  RETURN v_result;
END;
$$;

-- 3. Crear
CREATE OR REPLACE FUNCTION app.area_create(p_name VARCHAR)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO app.areas (name)
  VALUES (p_name)
  RETURNING to_jsonb(areas.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Actualizar
CREATE OR REPLACE FUNCTION app.area_update(p_id UUID, p_name VARCHAR)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE app.areas
  SET name = p_name, updated_at = NOW()
  WHERE id = p_id AND deleted_at IS NULL
  RETURNING to_jsonb(areas.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Eliminar (Soft Delete)
CREATE OR REPLACE FUNCTION app.area_delete(p_id UUID)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  UPDATE app.areas
  SET deleted_at = NOW()
  WHERE id = p_id AND deleted_at IS NULL;

  RETURN jsonb_build_object('deleted', true);
END;
$$;
```

---

## 24. Docker y Despliegue

### `.dockerignore`

```dockerignore
node_modules
dist
.env
.env.*
.git
.gitignore
coverage
tests
*.md
.vscode
.idea
```

### `Dockerfile` (Multi-stage Build)

```dockerfile
# ─── Etapa 1: Build ───
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# ─── Etapa 2: Producción ───
FROM node:22-alpine AS production

RUN apk add --no-cache tzdata dumb-init
ENV TZ=America/Santiago

RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### `docker-compose.yml`

```yaml
services:
  api:
    build:
      context: .
      target: production
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

---

## 25. Testing

```typescript
// tests/unit/services/area.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AreaService from "../../../src/services/area";
import * as AreaModel from "../../../src/models/area";

vi.mock("../../../src/models/area");

describe("AreaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería retornar el área cuando existe", async () => {
    const mockArea = { id: "a1", name: "Tecnología", createdAt: new Date() };
    vi.mocked(AreaModel.getById).mockResolvedValue(mockArea as any);

    const result = await AreaService.getById("a1");
    expect(result).toEqual(mockArea);
  });

  it("debería lanzar NotFoundError cuando no existe", async () => {
    vi.mocked(AreaModel.getById).mockResolvedValue(null);

    await expect(AreaService.getById("non-existent")).rejects.toThrow("Área no encontrado");
  });
});
```

---

## 26. Scripts de Ejecución

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/ --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 27. Checklist Pre-Deploy y Estructura Final

- [ ] `.env` está excluido de Git y del contexto Docker.
- [ ] Endpoints implementan `/getAll`, `/getById/:id`, `/create`, `/update/:id`, `/delete/:id`.
- [ ] Listados retornan `{ data: T[], total: number }` para paridad con Zustand.
- [ ] Middleware `validateRequest` genera errores en string y desglosa en `details`.
- [ ] Rutas agrupadas bajo `/api/v1` (incluyendo `/api/v1/auth`).
- [ ] Hashing utiliza `@node-rs/bcrypt` o `argon2`.
- [ ] Stored Procedures usan consultas parametrizadas.
- [ ] Pruebas unitarias ejecutadas con éxito (`yarn test`).
- [ ] Comprobación estricta de tipos exitosa (`yarn typecheck`).
