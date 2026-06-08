# ADI Soporte — Sistema de Gestión de Tickets

> Plataforma de auditoría y control de fallas del sistema ADI (Administrador de Incidencias), desarrollada como tesina de licenciatura por el Equipo X-CORP.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Stack tecnológico](#stack-tecnológico)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Base de datos](#base-de-datos)
6. [Módulos del backend](#módulos-del-backend)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Ciclo de vida de un ticket](#ciclo-de-vida-de-un-ticket)
9. [Variables de entorno](#variables-de-entorno)
10. [Instalación y ejecución local](#instalación-y-ejecución-local)
11. [Despliegue](#despliegue)
12. [Equipo](#equipo)

---

## Descripción general

ADI Soporte es la plataforma de auditoría y control de fallas del sistema principal ADI. Cuando un usuario del sistema ADI encuentra una incidencia técnica, la reporta a través de ADI Soporte, donde queda registrada como un ticket. El equipo de soporte técnico revisa, prioriza, asigna y resuelve cada ticket, manteniendo un historial de auditoría completo de todos los cambios realizados.

La plataforma se compone de dos partes:

- **Backend**: API REST en Node.js/Express que gestiona toda la lógica de negocio, expuesta tanto al panel de soporte como al sistema ADI externo.
- **Frontend**: Aplicación web en React (Vite) para el panel de administradores y técnicos de soporte.

---

## Arquitectura del proyecto

```
/
├── backend/          # API REST (Node.js + Express)
└── frontend/         # Panel web (React + Vite)
```

El backend expone una API REST consumida por dos clientes:

1. El **frontend de soporte** (panel web para admins y técnicos), que requiere autenticación JWT para todas sus operaciones.
2. El **sistema ADI externo**, que accede a un subconjunto de endpoints públicos (sin autenticación) para crear tickets y consultar su estado.

El frontend se comunica con el backend mediante Axios. En desarrollo, Vite proxea `/api` hacia `http://localhost:3000`. En producción, `VITE_API_URL` apunta al backend desplegado en Vercel.

---

## Stack tecnológico

### Backend

| Tecnología        | Versión | Rol                                   |
| ----------------- | ------- | ------------------------------------- |
| Node.js           | ≥ 18    | Entorno de ejecución                  |
| Express           | 5.2.1   | Framework HTTP                        |
| Supabase JS       | 2.105.3 | Cliente de base de datos (PostgreSQL) |
| JSON Web Token    | 9.0.3   | Autenticación stateless               |
| bcrypt            | 6.0.0   | Hash de contraseñas                   |
| express-validator | 7.3.2   | Validación de entradas                |
| helmet            | 8.1.0   | Cabeceras de seguridad HTTP           |
| cors              | 2.8.6   | Control de origen cruzado             |
| dotenv            | 17.4.2  | Variables de entorno                  |
| nodemon           | 3.1.14  | Recarga automática en desarrollo      |

### Frontend

| Tecnología       | Versión | Rol                               |
| ---------------- | ------- | --------------------------------- |
| React            | 19.2.5  | Librería de UI                    |
| Vite             | 8.0.10  | Bundler y servidor de desarrollo  |
| React Router DOM | 7.15.0  | Enrutamiento del lado del cliente |
| Axios            | 1.16.0  | Cliente HTTP                      |
| Framer Motion    | 12.38.0 | Animaciones                       |
| React Icons      | 5.6.0   | Íconos                            |

### Servicios externos

| Servicio              | Uso                                                           |
| --------------------- | ------------------------------------------------------------- |
| Supabase (PostgreSQL) | Base de datos principal, región us-west-2                     |
| Cloudinary            | Almacenamiento de imágenes (evidencias de tickets)            |
| Brevo (ex-Sendinblue) | Envío de correos transaccionales (recuperación de contraseña) |
| Vercel                | Despliegue de backend y frontend                              |

---

## Estructura de carpetas

```
backend/
├── api/
│   └── index.js                  # Punto de entrada para Vercel (exporta app Express)
├── src/
│   ├── app.js                    # Configuración de Express: middlewares y rutas
│   ├── config/
│   │   └── db.js                 # Cliente Supabase (service role key)
│   ├── middlewares/
│   │   └── auth.middleware.js    # authenticate (JWT), isAdmin (role === 1)
│   ├── modules/
│   │   ├── auth/                 # Usuarios de soporte, login, JWT, reset de contraseña
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.queries.js
│   │   │   └── auth.routes.js
│   │   ├── tickets/              # CRUD y ciclo de vida completo de tickets
│   │   │   ├── tickets.controller.js
│   │   │   ├── tickets.queries.js
│   │   │   └── tickets.routes.js
│   │   ├── faqs/                 # Preguntas frecuentes por área
│   │   │   ├── faqs.controller.js
│   │   │   ├── faqs.queries.js
│   │   │   └── faqs.routes.js
│   │   ├── areas/                # Catálogo de áreas
│   │   │   ├── areas.controllers.js
│   │   │   ├── areas.queries.js
│   │   │   └── areas.routes.js
│   │   └── error-types/          # Tipos de error por área
│   │       ├── error-types.controller.js
│   │       ├── error-types.queries.js
│   │       └── error-types.routes.js
│   └── services/
│       └── email.service.js      # Integración con API REST de Brevo
├── server.js                     # Arranca el servidor HTTP local
├── vercel.json                   # Configuración de despliegue en Vercel
└── package.json

frontend/
├── src/
│   └── main.jsx                  # Punto de entrada React
├── index.html                    # Shell HTML (fuente Inter desde Google Fonts)
├── vite.config.js                # Proxy /api → localhost:3000 en desarrollo
├── vercel.json                   # Rewrites para SPA (todas las rutas → index.html)
└── package.json
```

---

## Base de datos

La base de datos está alojada en **Supabase (PostgreSQL)**. A continuación se describen todas las tablas del esquema.

### Tablas de catálogo

#### `roles`

Roles posibles para los usuarios del sistema de soporte.

| Columna | Tipo        | Descripción           |
| ------- | ----------- | --------------------- |
| `id`    | bigint (PK) | Identificador del rol |
| `name`  | text        | Nombre del rol        |

Valores: `1` = Administrador, `2` = Técnico.

#### `status`

Estados posibles de un ticket.

| Columna | Tipo        | Descripción              |
| ------- | ----------- | ------------------------ |
| `id`    | bigint (PK) | Identificador del estado |
| `name`  | text        | Nombre del estado        |

Valores: `1` = Pendiente, `2` = Asignado, `3` = Resuelto, `4` = En Revisión, `5` = Desestimado.

#### `priority`

Niveles de prioridad con su tiempo de SLA.

| Columna     | Tipo        | Descripción                      |
| ----------- | ----------- | -------------------------------- |
| `id`        | bigint (PK) | Identificador de la prioridad    |
| `name`      | text        | Nombre de la prioridad           |
| `sla_hours` | integer     | Horas de SLA para esta prioridad |

Valores: `1` = Baja, `2` = Media, `3` = Alta, `4` = Urgente.

#### `areas`

Áreas de soporte a las que pertenecen los tipos de error y las FAQs.

| Columna       | Tipo                         | Descripción            |
| ------------- | ---------------------------- | ---------------------- |
| `id`          | bigint (PK, autoincremental) | Identificador del área |
| `name`        | text                         | Nombre del área        |
| `description` | text                         | Descripción del área   |
| `created_at`  | timestamptz                  | Fecha de creación      |

#### `error_types`

Tipos de error disponibles dentro de cada área.

| Columna      | Tipo                         | Descripción                     |
| ------------ | ---------------------------- | ------------------------------- |
| `id`         | bigint (PK, autoincremental) | Identificador del tipo de error |
| `area_id`    | bigint (FK → areas)          | Área a la que pertenece         |
| `name`       | text                         | Nombre del tipo de error        |
| `created_at` | timestamptz                  | Fecha de creación               |

---

### Tablas operativas

#### `support_users`

Usuarios del sistema de soporte (administradores y técnicos).

| Columna      | Tipo                         | Descripción                     |
| ------------ | ---------------------------- | ------------------------------- |
| `id`         | bigint (PK, autoincremental) | Identificador del usuario       |
| `name`       | text                         | Nombre                          |
| `apat`       | text                         | Apellido paterno                |
| `amat`       | text                         | Apellido materno                |
| `role`       | bigint (FK → roles)          | Rol del usuario                 |
| `email`      | text (único)                 | Correo electrónico              |
| `password`   | text                         | Contraseña hasheada con bcrypt  |
| `is_active`  | boolean                      | Indica si la cuenta está activa |
| `created_at` | timestamptz                  | Fecha de creación               |
| `last_login` | timestamptz                  | Última sesión iniciada          |

#### `tickets`

Tickets de soporte generados desde el sistema ADI.

| Columna           | Tipo                         | Descripción                                              |
| ----------------- | ---------------------------- | -------------------------------------------------------- |
| `id`              | bigint (PK, autoincremental) | Identificador del ticket                                 |
| `adi_user_id`     | bigint                       | ID del usuario en el sistema ADI que reportó             |
| `adi_rol_id`      | bigint                       | ID del rol del usuario en el sistema ADI                 |
| `area_id`         | bigint (FK → areas)          | Área del problema                                        |
| `error_type_id`   | bigint (FK → error_types)    | Tipo de error reportado                                  |
| `description`     | text                         | Descripción del problema (máx. 250 caracteres)           |
| `evidence_url`    | text                         | URL de imagen de evidencia (opcional)                    |
| `priority_id`     | bigint (FK → priority)       | Prioridad asignada                                       |
| `status_id`       | bigint (FK → status)         | Estado actual (default: 1 = Pendiente)                   |
| `assigned_to`     | bigint (FK → support_users)  | Técnico asignado                                         |
| `assigned_by`     | bigint (FK → support_users)  | Admin que realizó la asignación                          |
| `assigned_at`     | timestamptz                  | Fecha y hora de asignación                               |
| `resolution_note` | text                         | Nota de resolución o motivo de desestimación             |
| `sla_deadline`    | timestamptz                  | Fecha límite calculada según `sla_hours` de la prioridad |
| `reopened_count`  | integer                      | Número de veces que el ticket fue reabierto (default: 0) |
| `created_at`      | timestamptz                  | Fecha de creación                                        |
| `updated_at`      | timestamptz                  | Última actualización                                     |

#### `tickets_limits`

Límites de tickets por rol ADI y prioridad. Si no existe una fila para una combinación rol-prioridad, no hay límite aplicable.

| Columna       | Tipo                         | Descripción                         |
| ------------- | ---------------------------- | ----------------------------------- |
| `id`          | bigint (PK, autoincremental) | Identificador                       |
| `adi_rol_id`  | bigint                       | ID del rol en el sistema ADI        |
| `priority_id` | bigint (FK → priority)       | Prioridad limitada                  |
| `max_tickets` | integer                      | Número máximo de tickets permitidos |

#### `tickets_comments`

Comentarios en el hilo interno de un ticket, visible solo para el admin y el técnico asignado.

| Columna      | Tipo                         | Descripción                                    |
| ------------ | ---------------------------- | ---------------------------------------------- |
| `id`         | bigint (PK, autoincremental) | Identificador del comentario                   |
| `ticket_id`  | bigint (FK → tickets)        | Ticket al que pertenece                        |
| `author_id`  | bigint (FK → support_users)  | Usuario que comentó                            |
| `message`    | text                         | Contenido del comentario (máx. 200 caracteres) |
| `created_at` | timestamptz                  | Fecha de creación                              |

#### `tickets_history`

Auditoría de todos los cambios realizados en cada ticket.

| Columna         | Tipo                         | Descripción                   |
| --------------- | ---------------------------- | ----------------------------- |
| `id`            | bigint (PK, autoincremental) | Identificador del registro    |
| `ticket_id`     | bigint (FK → tickets)        | Ticket auditado               |
| `changed_by`    | bigint (FK → support_users)  | Usuario que realizó el cambio |
| `field_changed` | text                         | Nombre del campo modificado   |
| `old_value`     | text                         | Valor anterior                |
| `new_value`     | text                         | Valor nuevo                   |
| `created_at`    | timestamptz                  | Fecha y hora del cambio       |

#### `support_notifications`

Notificaciones generadas para los usuarios del sistema ADI sobre el estado de sus tickets.

| Columna       | Tipo                         | Descripción                          |
| ------------- | ---------------------------- | ------------------------------------ |
| `id`          | bigint (PK, autoincremental) | Identificador de la notificación     |
| `adi_user_id` | bigint                       | Usuario ADI destinatario             |
| `ticket_id`   | bigint (FK → tickets)        | Ticket relacionado                   |
| `title`       | text                         | Título de la notificación            |
| `message`     | text                         | Cuerpo de la notificación            |
| `is_read`     | boolean                      | Indica si fue leída (default: false) |
| `created_at`  | timestamptz                  | Fecha de creación                    |
| `read_at`     | timestamptz                  | Fecha en que fue leída               |

#### `faqs`

Preguntas frecuentes asociadas a un área, gestionadas por los administradores.

| Columna      | Tipo                         | Descripción                   |
| ------------ | ---------------------------- | ----------------------------- |
| `id`         | bigint (PK, autoincremental) | Identificador de la FAQ       |
| `area_id`    | bigint (FK → areas)          | Área a la que pertenece       |
| `question`   | text                         | Pregunta (10–80 caracteres)   |
| `answer`     | text                         | Respuesta (30–400 caracteres) |
| `created_by` | bigint (FK → support_users)  | Usuario que la creó           |
| `updated_by` | bigint (FK → support_users)  | Último usuario que la editó   |
| `created_at` | timestamptz                  | Fecha de creación             |
| `updated_at` | timestamptz                  | Última actualización          |

#### `password_reset_tokens`

Tokens de un solo uso para la recuperación de contraseña.

| Columna      | Tipo                         | Descripción                                          |
| ------------ | ---------------------------- | ---------------------------------------------------- |
| `id`         | bigint (PK, autoincremental) | Identificador                                        |
| `user_id`    | bigint (FK → support_users)  | Usuario al que pertenece el token                    |
| `token`      | text (único)                 | Token aleatorio de 64 caracteres hex                 |
| `expires_at` | timestamptz                  | Fecha de expiración (1 hora desde la creación)       |
| `used`       | boolean                      | Indica si el token ya fue consumido (default: false) |
| `created_at` | timestamptz                  | Fecha de creación                                    |

---

## Módulos del backend

### `auth`

Gestiona usuarios del sistema de soporte, autenticación JWT y recuperación de contraseña.

**Flujo de autenticación:**

Los tokens JWT se firman con `JWT_SECRET` y tienen una vigencia de 7 días. El payload incluye `id`, `email` y `role`. El logout es stateless: el cliente elimina el token localmente.

**Flujo de recuperación de contraseña:**

1. `POST /api/auth/forgot-password` — Se genera un token aleatorio de 32 bytes (64 chars hex), se almacena en `password_reset_tokens` con expiración de 1 hora y se envía por email via Brevo.
2. `GET /api/auth/validate-reset-token?token=xxx` — Verifica que el token exista, no haya sido usado y no haya expirado (sin consumirlo).
3. `POST /api/auth/reset-password` — Establece la nueva contraseña y marca el token como `used = true`.

La respuesta de `forgot-password` es siempre la misma independientemente de si el email existe o no, para evitar enumeración de usuarios.

### `tickets`

Núcleo del sistema. Gestiona la creación, asignación, resolución, reapertura y desestimación de tickets, así como el historial de auditoría y el sistema de comentarios internos.

**Reglas de límites:** Al asignar un ticket, el sistema consulta `tickets_limits` para verificar si el usuario ADI ha alcanzado el máximo de tickets con esa prioridad permitidos para su rol. Si no existe configuración para esa combinación, no se aplica límite.

**SLA:** Al asignar un ticket, `sla_deadline` se calcula como `NOW + sla_hours` de la prioridad elegida. Al reabrir un ticket, el SLA se recalcula desde el momento de la reapertura.

### `faqs`

Preguntas frecuentes por área. La lectura es pública (consumible desde el sistema ADI). La creación, edición y eliminación requieren autenticación de administrador.

### `areas`

Catálogo de áreas de soporte. Solo lectura pública.

### `error-types`

Tipos de error filtrados por `area_id`. Solo lectura pública.

---

## Endpoints de la API

### Autenticación — `/api/auth`

| Método | Ruta                    | Auth       | Descripción                                   |
| ------ | ----------------------- | ---------- | --------------------------------------------- |
| POST   | `/login`                | No         | Inicio de sesión, retorna JWT                 |
| POST   | `/logout`               | Sí         | Cierre de sesión (stateless)                  |
| POST   | `/register`             | Sí (admin) | Crear nuevo usuario de soporte                |
| PUT    | `/change-password`      | Sí         | Cambiar contraseña propia                     |
| GET    | `/users`                | Sí (admin) | Listar todos los usuarios                     |
| GET    | `/users/:id`            | Sí (admin) | Detalle de un usuario                         |
| PUT    | `/users/:id`            | Sí (admin) | Editar datos de un usuario                    |
| DELETE | `/users/:id`            | Sí (admin) | Eliminar un usuario                           |
| POST   | `/forgot-password`      | No         | Solicitar token de recuperación de contraseña |
| POST   | `/reset-password`       | No         | Restablecer contraseña con token              |
| GET    | `/validate-reset-token` | No         | Verificar vigencia de un token                |

### Tickets — `/api/tickets`

| Método | Ruta                     | Auth       | Descripción                                       |
| ------ | ------------------------ | ---------- | ------------------------------------------------- |
| POST   | `/`                      | No         | Crear ticket (llamado desde el sistema ADI)       |
| GET    | `/user/:adi_user_id`     | No         | Tickets de un usuario ADI                         |
| GET    | `/user/:adi_user_id/:id` | No         | Detalle de un ticket para usuario ADI             |
| GET    | `/technicians`           | Sí (admin) | Listar técnicos activos disponibles               |
| GET    | `/`                      | Sí         | Admin: todos los tickets; Técnico: solo los suyos |
| GET    | `/:id`                   | Sí         | Detalle de un ticket                              |
| PATCH  | `/:id/assign`            | Sí (admin) | Asignar prioridad y técnico                       |
| PATCH  | `/:id/resolve`           | Sí         | Resolver ticket con nota (técnico asignado)       |
| PATCH  | `/:id/review`            | Sí (admin) | Aprobar resolución → estado Resuelto              |
| PATCH  | `/:id/reopen`            | Sí (admin) | Rechazar resolución → vuelve a Asignado           |
| PATCH  | `/:id/dismiss`           | Sí (admin) | Desestimar ticket Pendiente                       |
| GET    | `/:id/comments`          | Sí         | Leer comentarios internos del ticket              |
| POST   | `/:id/comments`          | Sí         | Agregar comentario interno                        |
| GET    | `/:id/history`           | Sí         | Ver historial de auditoría del ticket             |

### FAQs — `/api/faqs`

| Método | Ruta             | Auth       | Descripción                |
| ------ | ---------------- | ---------- | -------------------------- |
| GET    | `/`              | No         | Listar todas las FAQs      |
| GET    | `/area/:area_id` | No         | FAQs de un área específica |
| POST   | `/`              | Sí (admin) | Crear FAQ                  |
| PUT    | `/:id`           | Sí (admin) | Editar FAQ                 |
| DELETE | `/:id`           | Sí (admin) | Eliminar FAQ               |

### Áreas — `/api/areas`

| Método | Ruta | Auth | Descripción            |
| ------ | ---- | ---- | ---------------------- |
| GET    | `/`  | No   | Listar todas las áreas |

### Tipos de error — `/api/error-types`

| Método | Ruta             | Auth | Descripción               |
| ------ | ---------------- | ---- | ------------------------- |
| GET    | `/area/:area_id` | No   | Tipos de error de un área |

### Health check

| Método | Ruta          | Descripción                           |
| ------ | ------------- | ------------------------------------- |
| GET    | `/api/health` | Retorna `{ status: "ok", timestamp }` |

---

## Ciclo de vida de un ticket

```
[Sistema ADI]
     │
     │  POST /api/tickets
     ▼
 PENDIENTE (1)
     │
     ├─── PATCH /:id/dismiss (admin) ──────────────▶  DESESTIMADO (5)
     │
     │    PATCH /:id/assign (admin)
     ▼    (asigna técnico, prioridad y sla_deadline)
 ASIGNADO (2)
     │
     │    PATCH /:id/resolve (técnico asignado)
     │    (escribe resolution_note)
     ▼
 EN REVISIÓN (4)
     │
     ├─── PATCH /:id/review (admin) ───────────────▶  RESUELTO (3)
     │    (aprueba la resolución)
     │
     └─── PATCH /:id/reopen (admin) ───────────────▶  ASIGNADO (2)
          (rechaza la resolución; mismo técnico
           y prioridad, SLA recalculado)
```

Al reabrir un ticket se mantienen el técnico y la prioridad asignados originalmente, se recalcula `sla_deadline` desde el momento de la reapertura, se incrementa `reopened_count` y el motivo queda registrado tanto en `tickets_history` como en un comentario automático en `tickets_comments`.

---

## Variables de entorno

> ⚠️ Nunca incluir valores reales de estas variables en el repositorio.

### Backend (`backend/.env`)

| Variable               | Descripción                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `PORT`                 | Puerto del servidor (default: `3000`)                                                |
| `NODE_ENV`             | Entorno de ejecución (`development` / `production`)                                  |
| `SUPABASE_URL`         | URL del proyecto Supabase                                                            |
| `SUPABASE_SERVICE_KEY` | Clave de servicio de Supabase (service role key)                                     |
| `JWT_SECRET`           | Cadena secreta para firmar tokens JWT                                                |
| `BREVO_API_KEY`        | API Key de Brevo para envío de emails                                                |
| `EMAIL_FROM`           | Dirección de correo remitente verificada en Brevo                                    |
| `FRONTEND_URL`         | URL base del frontend sin slash final (usada en el enlace del email de recuperación) |

### Frontend (`frontend/.env`)

| Variable                        | Descripción                                               |
| ------------------------------- | --------------------------------------------------------- |
| `VITE_API_URL`                  | URL base del backend (en producción, la URL de Vercel)    |
| `VITE_CLOUDINARY_CLOUD_NAME`    | Cloud Name del proyecto en Cloudinary                     |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Upload Preset de Cloudinary (debe ser de tipo _Unsigned_) |

---

## Instalación y ejecución local

### Prerrequisitos

- Node.js ≥ 18
- Un proyecto Supabase con el esquema de base de datos aplicado
- Una cuenta de Brevo con un email remitente verificado
- Un proyecto en Cloudinary con un upload preset de tipo _Unsigned_

### Backend

```bash
cd backend
npm install

# Crear el archivo de variables de entorno y completarlo
cp .env.example .env  # Si no existe el archivo, crearlo manualmente con las variables listadas arriba

npm run dev
# El servidor escucha en http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install

# Crear el archivo de variables de entorno y completarlo
# VITE_API_URL=http://localhost:3000/api  (en desarrollo local)

npm run dev
# La aplicación corre en http://localhost:5173
# Las peticiones a /api se proxean automáticamente al backend (vite.config.js)
```

---

## Despliegue

Ambas partes están configuradas para desplegarse en **Vercel**.

### URLs de producción

| Parte    | URL                                        |
| -------- | ------------------------------------------ |
| Backend  | `https://adi-backend-umber.vercel.app/api` |
| Frontend | `https://adi-frontend-smoky.vercel.app`    |

### Backend

El archivo `vercel.json` enruta todas las peticiones al handler `api/index.js`, que exporta la instancia de Express:

```json
{
  "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.js" }]
}
```

### Frontend

El archivo `vercel.json` del frontend reescribe todas las rutas hacia `index.html` para soportar el enrutamiento SPA del lado del cliente:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Equipo

Proyecto desarrollado por **Equipo X-CORP** como tesina de licenciatura.

| Integrante                    |
| ----------------------------- |
| Briseño Muñoz Joseph Dylan    |
| Estrada Sevillano Rodrigo     |
| García Piedra Edwin Leonardo  |
| Gonzalez de Luna Luis Gerardo |
| Ortiz Avila Miguel Angel      |
