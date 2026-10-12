# Backend Manager

Skill de desarrollo backend para agentes de IA y desarrolladores. Define estándares de arquitectura por capas, convenciones de código y plantillas para servicios basados en Node.js 22+, Express 5, TypeScript, PostgreSQL 17, Zod y Docker.

---

## Arquitectura y Principios

- **Separación por capas:** Flujo unidireccional `Router` -> `Middleware` -> `Controller` -> `Service` -> `Model` -> `Query` -> `PostgreSQL (SP)`.
- **Paridad con Frontend Manager:** Contrato unificado de respuestas `{ success, data: { data: T[], total }, error }` en listados y endpoints canónicos (`/getAll`, `/getById/:id`, `/create`, `/update/:id`, `/delete/:id`).
- **Express 5 y TypeScript:** Manejo nativo de promesas en rutas asíncronas, resolución `NodeNext` y ejecución con `tsx`.
- **Validación con Zod:** Esquemas estrictos por entidad para creación y actualización, con sanitización y reporte estructurado de errores.
- **Seguridad por defecto:** Consultas parametrizadas en Stored Procedures (prevención de SQL Injection), Helmet con CSP estricto, Rate Limiting y hashing de contraseñas con `@node-rs/bcrypt`.
- **Persistencia en base de datos:** Procedimientos almacenados en esquema `app` con serialización JSON nativa (`rows[0].data`).

---

## Estructura del Repositorio

```text
backend_manager/
├── SKILL.md                          # Instrucciones y flujo de trabajo principal
├── references/                       # Documentación técnica de referencia
│   └── technical-architecture.md     # Especificación técnica detallada
├── resources/
│   └── templates/                    # Plantillas de código reutilizables
│       ├── router.template.ts        # Enrutador Express
│       ├── controller.template.ts    # Controlador HTTP
│       ├── service.template.ts       # Capa de servicio y lógica de dominio
│       ├── model.template.ts         # Modelo de datos y acceso a BD
│       ├── query.template.ts         # Consultas SQL a Stored Procedures
│       ├── schema.template.ts        # Esquemas Zod
│       ├── interface.template.ts     # Interfaces y contratos de datos
│       └── database-sp.template.sql  # Stored Procedures PL/pgSQL
├── CHANGELOG.md                      # Historial de cambios
├── LICENSE                           # Licencia MIT
└── README.md                         # Este documento
```

---

## Instalación y Uso

Colocar este directorio dentro de la ruta de skills del entorno de trabajo:

```bash
.agents/skills/backend_manager/
```

Para consultar el flujo de trabajo completo, ver [SKILL.md](./SKILL.md).

---

## Licencia

[MIT](./LICENSE)
