# Backend Manager (AI Agent Skill)

Skill especializada para guiar a los agentes de Inteligencia Artificial al diseñar, codificar, refactorizar y verificar servicios backend, APIs y lógica de negocio en Node.js 22+, Express 5, TypeScript 5+, PostgreSQL 17 y Docker.

---

## 📌 ¿Qué es este Skill?

**Backend Manager** es un paquete de directrices, estándares, plantillas y patrones de diseño creado específicamente para ser consumido por agentes de IA (como Antigravity, Claude Code, Cursor, Copilot, etc.). Su objetivo es garantizar que el código generado por IA siga las mejores prácticas de la industria, previniendo vulnerabilidades, deuda técnica y garantizando **paridad e interoperabilidad total con [frontend_manager](file:///home/LGK36T/workspace/skills/frontend_manager)**.

La especificación completa del comportamiento del agente se encuentra en [SKILL.md](file:///home/LGK36T/workspace/skills/backend_manager/SKILL.md).

---

## 🎯 Directrices que impone a la IA

- **Arquitectura Limpia y Desacoplada:** Flujo unidireccional estricto entre Routers, Middlewares, Controllers, Services, Models, Queries y Stored Procedures en PostgreSQL.
- **Paridad Total con Frontend Manager:** Respuestas estructuradas con `{ success, data: { data: T[], total }, error }` en listados y endpoints canónicos (`/getAll`, `/getById/:id`, `/create`, `/update/:id`, `/delete/:id`).
- **Validación Tipada con Zod:** Esquemas obligatorios para todas las entradas con mensajes de error legibles y detalles estructurados.
- **Seguridad Defensiva (Secure by Default):** Consultas parametrizadas en Stored Procedures (prevención SQL Injection), Helmet con CSP estricto, CORS controlado, Rate Limiting y `@node-rs/bcrypt` para hashing de contraseñas.
- **Tooling Moderno (2026):** Express 5 con captura nativa de errores asíncronos, `tsx` para desarrollo rápido y TypeScript con resolución `NodeNext`.
- **Plantillas Canónicas:** Plantillas listas para usar en cada capa del backend.

---

## 📂 Contenido del Repositorio

```text
backend_manager/
├── SKILL.md                          # Instrucciones principales y flujo de trabajo para el agente
├── CHANGELOG.md                      # Historial de cambios del skill
├── LICENSE                           # Licencia de código abierto (MIT)
├── README.md                         # Documentación y descripción del skill
├── references/
│   └── technical-architecture.md     # Referencia técnica exhaustiva y estándares backend
└── resources/
    └── templates/                    # Plantillas de código para el agente
        ├── router.template.ts        # Endpoints Express estándar
        ├── controller.template.ts    # Controladores puros (1 línea por método)
        ├── service.template.ts       # Lógica de dominio y excepciones
        ├── model.template.ts         # Acceso a base de datos (rows[0].data)
        ├── query.template.ts         # Llamadas SQL a stored procedures
        ├── schema.template.ts        # Esquemas de validación Zod
        ├── interface.template.ts     # Contratos e interfaces de modelos
        └── database-sp.template.sql  # Stored Procedures PL/pgSQL
```

---

## 🚀 Uso e Integración

### En Google Antigravity / Asistentes IA
Coloca este repositorio dentro del directorio de skills de tu espacio de trabajo:
```bash
.agents/skills/backend_manager/
# o ~/.gemini/antigravity-cli/skills/backend_manager/
```
El agente descubrirá automáticamente el archivo [SKILL.md](file:///home/LGK36T/workspace/skills/backend_manager/SKILL.md) y aplicará estas pautas de manera progresiva cuando interactúe con el backend.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](file:///home/LGK36T/workspace/skills/backend_manager/LICENSE).
