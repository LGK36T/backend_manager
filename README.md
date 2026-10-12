# Backend Manager (AI Agent Skill)

Skill especializada para guiar a los agentes de Inteligencia Artificial al diseñar, codificar, refactorizar y verificar servicios backend, APIs y lógica de negocio.

---

## 📌 ¿Qué es este Skill?

**Backend Manager** es un paquete de directrices, estándares y patrones de diseño creado específicamente para ser consumido por agentes de IA (como Antigravity, Claude Code, Cursor, Copilot, etc.). Su objetivo es garantizar que el código generado por IA siga las mejores prácticas de la industria, previniendo vulnerabilidades y deuda técnica.

La especificación completa del comportamiento del agente se encuentra en [SKILL.md](file:///home/LGK36T/workspace/skills/backend_manager/SKILL.md).

---

## 🎯 Directrices que impone a la IA

- **Arquitectura Limpia:** Separación estricta entre Controladores, Servicios y Repositorios.
- **Validación Tipada:** Esquemas obligatorios para todas las entradas de datos (body, query, params).
- **Seguridad Defensiva:** Prevención de inyecciones SQL/NoSQL, sanitización, autenticación robusta y manejo seguro de secretos.
- **Gestión de Errores:** Errores de dominio semánticos y middleware global de excepciones sin fugas de información interna.
- **Verificación Continua:** Pruebas unitarias y de integración automáticas para cada endpoint o servicio modificado.

---

## 📂 Contenido del Repositorio

```text
backend_manager/
├── SKILL.md             # Instrucciones principales para el agente de IA
├── CHANGELOG.md         # Historial de cambios del skill
├── LICENSE              # Licencia de código abierto (MIT)
├── README.md            # Documentación y descripción del skill
└── .gitignore           # Exclusiones de control de versiones
```

---

## 🚀 Uso e Integración

### En Google Antigravity / Asistentes IA
Coloca este repositorio dentro del directorio de skills de tu espacio de trabajo:
```bash
.agents/skills/backend_manager/
# o ~/.gemini/antigravity-cli/skills/backend_manager/
```
El agente descubrirá automáticamente el archivo `SKILL.md` y aplicará estas pautas de manera progresiva cuando interactúe con el backend.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](file:///home/LGK36T/workspace/skills/backend_manager/LICENSE).
