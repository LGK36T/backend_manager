---
name: backend-manager
description: >-
  Instrucciones, directrices arquitectónicas y estándares de codificación para agentes de IA al diseñar, implementar, refactorizar y verificar servicios backend, APIs y lógica de negocio.
---

# Skill: Backend Manager para Agentes de IA

Este skill define las directrices y estándares para que los agentes de IA actúen como ingenieros backend senior al diseñar, implementar y mantener servicios de servidor, APIs y lógica de negocio.

---

## 🎯 Directrices Principales de Comportamiento

Cuando el agente de IA trabaje en tareas de backend, debe cumplir rigurosamente las siguientes pautas:

### 1. Arquitectura en Capas y Desacoplamiento
- **Controladores (Controllers / Handlers):** Responsables únicamente de la entrada/salida HTTP, validación inicial del request y mapeo de códigos de estado (status codes). No deben contener lógica de negocio.
- **Servicios (Services / Use Cases):** Concentran la lógica de negocio, validaciones de dominio y orquestación. Son completamente agnósticos del transporte (REST, gRPC, CLI).
- **Repositorios / Acceso a Datos (Repositories / DAOs):** Encapsulan consultas a bases de datos o almacenamiento. Jamás mezclar consultas directas de datos en controladores.
- **Middleware:** Emplear para autenticación, autorización, validación de esquemas, compresión, rate limiting y logging transversal.

### 2. Validación Estricta de Tipos y Esquemas
- Toda petición entrante (body, query params, headers, path params) debe validarse contra un esquema tipado (ej. Zod, Joi, Pydantic, DTOs).
- Jamás confiar en datos externos sin parsear y sanitizar antes de enviarlos a la capa de servicios.

### 3. Seguridad por Defecto (Secure by Default)
- **Prevención de Inyecciones:** Usar consultas parametrizadas u ORMs que prevengan SQL/NoSQL Injection.
- **Autenticación y Autorización:** Validar tokens (JWT/Session) en middlewares dedicados; nunca confiar ciegamente en IDs de usuario provistos en el body.
- **Manejo Seguro de Secretos:** Nunca quemar (hardcodear) claves, tokens o URIs de conexión. Usar variables de entorno seguras.
- **CORS y Cabeceras:** Configurar CORS estricto y cabeceras de seguridad HTTP (Helmet, CSP, HSTS).

### 4. Manejo Defensivo de Excepciones y Errores
- Utilizar errores de dominio estructurados (ej. `NotFoundError`, `UnauthorizedError`, `ValidationError`).
- Capturar excepciones en un middleware global de errores.
- Nunca exponer trazas de error (stack traces) ni detalles internos de la base de datos en respuestas de producción.

### 5. Estándares de Pruebas y Verificación
- Diseñar y actualizar pruebas unitarias para la lógica en `services`.
- Verificar códigos de respuesta HTTP estándar (200, 201, 400, 401, 403, 404, 500).
- Ejecutar linters y suite de pruebas antes de dar por completada una tarea.

---

## 🚫 Acciones Prohibidas para el Agente

- ❌ Escribir controladores monolíticos con acceso directo a base de datos.
- ❌ Ignorar errores con bloques vacíos (`catch (e) {}` o `except: pass`).
- ❌ Deshabilitar validaciones de seguridad o reglas CORS en producción.
- ❌ Almacenar contraseñas sin hashing seguro (Argon2, bcrypt).
