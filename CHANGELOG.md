# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.0.0] - 2026-10-12

### Añadido
- Documento exhaustivo de arquitectura técnica en [references/technical-architecture.md](file:///home/LGK36T/workspace/skills/backend_manager/references/technical-architecture.md).
- Plantillas canónicas de código en `resources/templates/`:
  - `router.template.ts` (Endpoints compatibles con frontend_manager: `/getAll`, `/getById/:id`, `/create`, `/update/:id`, `/delete/:id`).
  - `controller.template.ts` (Adaptadores HTTP de una línea delegando a servicios).
  - `service.template.ts` (Reglas de dominio y validaciones independientes del transporte).
  - `model.template.ts` (Acceso a base de datos extrayendo `rows[0].data`).
  - `query.template.ts` (Llamadas SQL a Stored Procedures en esquema `app`).
  - `schema.template.ts` (Validación Zod para payloads de entrada).
  - `interface.template.ts` (Contratos TypeScript alineados con el frontend).
  - `database-sp.template.sql` (Stored Procedures PL/pgSQL retornando JSON con `{ data, total }`).
- Soporte para `@node-rs/bcrypt` para hashing de contraseñas de alto rendimiento.
- Integración de `tsx` para desarrollo rápido en reemplazo de `ts-node-dev`.
- Documentación de Graceful Shutdown y health check `/health`.

### Modificado
- Actualizado [SKILL.md](file:///home/LGK36T/workspace/skills/backend_manager/SKILL.md) con flujo de trabajo por fases de 9 pasos y reglas estrictas para agentes de IA.
- Actualizado el stack base a Express 5 (`express@^5.1`), Node 22+, TypeScript 5+ (`NodeNext`), PostgreSQL 17 y Docker Compose V2.
- Unificado el contrato de respuestas en listados (`getAll`) para garantizar paridad con el frontend: retorno obligatorio de `{ data: T[], total: number }`.
- Unificado el middleware `validateRequest` para devolver `error` en formato `string` legible y el desglose en `details`.
- Unificado el enrutador de autenticación bajo el prefijo versionado `/api/v1/auth`.

---

## [0.2.0] - 2026-10-11

### Añadido
- Archivo nativo para agentes de IA ([SKILL.md](file:///home/LGK36T/workspace/skills/backend_manager/SKILL.md)) con directrices de arquitectura limpia, validación tipada, seguridad y manejo de errores.
- Licencia de código abierto MIT ([LICENSE](file:///home/LGK36T/workspace/skills/backend_manager/LICENSE)).

### Modificado
- Reorientación completa del proyecto de módulo genérico a **Skill para agentes de IA** en [README.md](file:///home/LGK36T/workspace/skills/backend_manager/README.md).

---

## [0.1.0] - 2026-10-11

### Añadido
- Inicialización del repositorio Git y configuración base del proyecto.
- Documentación inicial y registro de control de cambios.
- Configuración de exclusiones de archivos para control de versiones (`.gitignore`).
