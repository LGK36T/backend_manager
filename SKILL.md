---
name: backend-manager
description: >-
  Instrucciones y estándares para construir y mantener servicios backend en Node.js 22+, Express 5, TypeScript, PostgreSQL 17, Zod y Docker.
---

# Backend Manager

Guía de arquitectura y flujo de desarrollo para servicios backend en Node.js 22+, Express 5, TypeScript, PostgreSQL 17, Zod y Docker.

---

## Arquitectura por Capas

El flujo de procesamiento de peticiones es estrictamente unidireccional:

```
Request -> Router -> Middleware -> Controller -> Service -> Model -> Query -> PostgreSQL (SP)
                                                                                ↓
Response <- Controller <- Service <- Model <- rows[0].data ─────────────────────┘
```

Documentación detallada en [Guía de Arquitectura Técnica](./references/technical-architecture.md).

---

## Flujo de Trabajo

Al implementar o modificar un módulo (feature), seguir este orden:

### 1. Diseñar Stored Procedures en PostgreSQL
- Ubicación / Esquema: siempre en `app.{entity}_*`.
- En listados (`_get_all`): retornar `{ data: json_agg(...), total: count(*) }`.
- En operaciones individuales: retornar la fila como `jsonb` o `{ deleted: true }`.
- Referencia: [database-sp.template.sql](./resources/templates/database-sp.template.sql).

### 2. Definir Interfaces
- Ubicación: `src/interfaces/models/{entity}.ts`.
- Mantener paridad con los contratos del frontend.
- Exportar `I{Entity}`, `I{Entity}GetAllResponse`, `I{Entity}CreatePayload`, `I{Entity}UpdatePayload`.
- Referencia: [interface.template.ts](./resources/templates/interface.template.ts).

### 3. Declarar Consultas SQL
- Ubicación: `src/queries/{entity}.ts`.
- Declarar llamadas a stored procedures (`SELECT app.{entity}_*(...) AS data`).
- Sin SQL inline ni concatenación de cadenas.
- Referencia: [query.template.ts](./resources/templates/query.template.ts).

### 4. Implementar Modelo
- Ubicación: `src/models/{entity}.ts`.
- Ejecutar consultas vía pool de `pg` y extraer `result.rows[0]?.data`.
- En listados vacíos, devolver `{ data: [], total: 0 }`.
- Referencia: [model.template.ts](./resources/templates/model.template.ts).

### 5. Crear Esquemas de Validación
- Ubicación: `src/schemas/{entity}.ts`.
- Definir esquemas con Zod (`create{Entity}Schema`, `update{Entity}Schema`).
- Aplicar `.trim()` y sanitizaciones obligatorias.
- Referencia: [schema.template.ts](./resources/templates/schema.template.ts).

### 6. Desarrollar Capa de Servicio
- Ubicación: `src/services/{entity}.ts`.
- Concentrar reglas de negocio, validaciones de dominio y orquestación.
- Lanzar errores estructurados (`NotFoundError`, `ConflictError`, `ValidationError`).
- No importar tipos ni utilidades de transporte HTTP (`express`, `req`, `res`).
- Referencia: [service.template.ts](./resources/templates/service.template.ts).

### 7. Implementar Controlador
- Ubicación: `src/controllers/{entity}.ts`.
- Adaptador HTTP puro. Cada función extrae parámetros, invoca al servicio y responde mediante `sendResponse`.
- No incluir lógica de dominio ni condicionales de negocio.
- Referencia: [controller.template.ts](./resources/templates/controller.template.ts).

### 8. Configurar Rutas y Middlewares
- Ubicación: `src/routers/{entity}.ts`.
- Encadenar `authenticate`, `validateRequest` y el controlador.
- Endpoints estándar:
  - `GET /getAll`
  - `GET /getById/:id`
  - `POST /create`
  - `PUT /update/:id`
  - `DELETE /delete/:id`
- Registrar el recurso en `src/routers/index.ts` bajo `/api/v1/{entity}`.
- Referencia: [router.template.ts](./resources/templates/router.template.ts).

### 9. Diseñar e Implementar Pruebas Automatizadas (Obligatorio)
- Ubicación: `tests/schemas/{entity}.test.ts`, `tests/services/{entity}.test.ts`, `tests/controllers/{entity}.test.ts`.
- Pruebas unitarias para esquemas Zod (validación de formatos y sanitización `.trim()`).
- Pruebas unitarias para la capa de servicio con modelos desacoplados o mockeados.
- Pruebas de integración HTTP para enrutadores y controladores verificando códigos de estado canónicos (`200`, `201`, `202`, `400`, `404`).
- Referencia: Skill `testing_manager` en `/home/LGK36T/workspace/skills/testing_manager`.

### 10. Verificación y Pase de Pruebas (Política de Cero Fallos)
```bash
yarn test || npx tsx --test tests/**/*.test.ts
yarn typecheck || npx tsc --noEmit
```
**Regla ineludible:** Si un solo test falla, la tarea NO puede darse por completada ni enviarse a control de versiones.

---

## Reglas Estrictas

- **Todo debe tener test y pasarlo:** Prohibido commitear o cerrar una feature sin suite de pruebas automatizadas aprobadas con 0 fallos.
- Mantener la estructura `{ data: T[], total: number }` en respuestas de colecciones (`getAll`).
- Utilizar `/create`, `/update/:id` y `/delete/:id` para coincidir con los servicios de `frontend_manager`.
- Montar las rutas de autenticación bajo el prefijo versionado (`/api/v1/auth`).
- En `validateRequest`, responder con un mensaje descriptivo en `error` (string) y el desglose en `details`.
- Toda interacción con la base de datos debe ejecutarse mediante Stored Procedures del esquema `app`.
- No escribir lógica de negocio en controladores.
- Usar `crypto.randomUUID()` nativo en lugar de dependencias externas para UUID.

---

## Referencias y Plantillas

- [Guía de Arquitectura Técnica](./references/technical-architecture.md)
- [Skill Testing Manager](/home/LGK36T/workspace/skills/testing_manager/SKILL.md)
- [Plantillas de Código](./resources/templates/)

