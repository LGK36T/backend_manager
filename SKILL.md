---
name: backend-manager
description: >-
  Instrucciones, estándares arquitectónicos y flujo de desarrollo para construir y mantener servicios backend en Node.js 22+, Express 5, TypeScript 5+, PostgreSQL 17 y Docker, garantizando paridad total con frontend_manager.
---

# Backend Manager

Guía de arquitectura, estándares de ingeniería y flujo de desarrollo para construir y mantener microservicios y APIs backend en Node.js 22+, Express 5, TypeScript, PostgreSQL 17, Zod y Vitest.

---

## Arquitectura por Capas

El flujo de procesamiento de una petición HTTP es unidireccional y estrictamente desacoplado:

```
Request → Router → Middlewares → Controller → Service → Model → Query → PostgreSQL (SP)
                                                                            ↓
Response ← Controller ← Service ← Model ← rows[0].data ────────────────────┘
```

Documentación completa y detallada en [Guía de Arquitectura Técnica](./references/technical-architecture.md).

---

## Flujo de Trabajo para Nuevas Entidades o Módulos

Al implementar o modificar una entidad de negocio en el backend, el agente debe seguir estrictamente este orden:

### 1. Diseñar Stored Procedures en PostgreSQL
- Esquema: siempre en `app.{entity}_*`.
- En listados (`_get_all`): retornar obligatoriamente un objeto JSON con `{ data, total }`.
- En operaciones individuales: serializar el resultado en `jsonb` o retornar `{ deleted: true }`.
- Referencia: [database-sp.template.sql](./resources/templates/database-sp.template.sql).

### 2. Definir Interfaces y Contratos de Datos
- Ubicación: `src/interfaces/models/{entity}.ts`.
- Mantener paridad 1:1 con las interfaces esperadas por el frontend (`frontend_manager`).
- Incluir `I{Entity}`, `I{Entity}GetAllResponse`, `I{Entity}CreatePayload`, `I{Entity}UpdatePayload`.
- Referencia: [interface.template.ts](./resources/templates/interface.template.ts).

### 3. Declarar Consultas SQL
- Ubicación: `src/queries/{entity}.ts`.
- Solo llamadas limpias a Stored Procedures (`SELECT app.{entity}_*(...) AS data`).
- Sin SQL inline ni concatenación de cadenas.
- Referencia: [query.template.ts](./resources/templates/query.template.ts).

### 4. Implementar Capa de Modelo
- Ubicación: `src/models/{entity}.ts`.
- Ejecutar queries mediante el pool de `pg` y extraer `result.rows[0]?.data`.
- Para listados vacíos, devolver `{ data: [], total: 0 }`.
- Referencia: [model.template.ts](./resources/templates/model.template.ts).

### 5. Crear Esquemas de Validación (Zod)
- Ubicación: `src/schemas/{entity}.ts`.
- Crear esquemas separados para creación y actualización (`create{Entity}Schema`, `update{Entity}Schema`).
- Aplicar `.trim()` y sanitizaciones necesarias.
- Referencia: [schema.template.ts](./resources/templates/schema.template.ts).

### 6. Desarrollar Capa de Servicio
- Ubicación: `src/services/{entity}.ts`.
- Concentrar las reglas de negocio, cálculos y validaciones de dominio.
- Usar excepciones tipadas (`NotFoundError`, `ConflictError`, `ValidationError`).
- Nunca importar `express`, `req` o `res`.
- Referencia: [service.template.ts](./resources/templates/service.template.ts).

### 7. Implementar Controlador
- Ubicación: `src/controllers/{entity}.ts`.
- Adaptador HTTP puro. Cada función es una llamada concisa de 1 línea a `sendResponse`.
- Sin lógica de negocio ni sentencias condicionales de dominio.
- Referencia: [controller.template.ts](./resources/templates/controller.template.ts).

### 8. Configurar Rutas y Middlewares
- Ubicación: `src/routers/{entity}.ts`.
- Encadenar `authenticate`, `validateRequest` y los controladores.
- Respetar los verbos y endpoints estándar:
  - `GET /getAll`
  - `GET /getById/:id`
  - `POST /create`
  - `PUT /update/:id`
  - `DELETE /delete/:id`
- Registrar en el router agrupador `src/routers/index.ts` bajo `/api/v1/{entity}`.
- Referencia: [router.template.ts](./resources/templates/router.template.ts).

### 9. Verificación de Tipos y Pruebas
```bash
yarn typecheck || npx tsc --noEmit
yarn test || npx vitest run
```

---

## Reglas Estrictas

- **Paridad con el Frontend:** En todo endpoint `getAll`, la respuesta debe contener `{ data: T[], total: number }`.
- **Rutas Estándar:** Usar siempre `/create`, `/update/:id` y `/delete/:id` para coincidir con los servicios Axios de `frontend_manager`.
- **Ubicación de Auth:** Las rutas de autenticación se exponen siempre con prefijo de versión (`/api/v1/auth/*`).
- **Seguridad en Errores:** En `validateRequest`, el campo `error` de la respuesta debe ser un `string` legible (ej. `"Error de validación en: name"`), y el desglose de campos debe viajar en `details`.
- **Acceso a Base de Datos:** Toda mutación o consulta compleja reside en Stored Procedures del esquema `app`. La app solo invoca `SELECT app.*`.
- **No Lógica en Controladores:** Si un controlador supera 1 línea dentro del `try/catch`, refactorizar la lógica hacia la capa de servicio.
- **Herramientas Modernas:** Usar `tsx watch` para desarrollo local y `@node-rs/bcrypt` para hashing de contraseñas.
- **Sin Dependencias Redundantes:** Usar `crypto.randomUUID()` nativo en lugar del paquete `uuid`.

---

## Referencias y Plantillas

- [Referencia Técnica Completa](./references/technical-architecture.md)
- [Plantillas de Código](./resources/templates/)
