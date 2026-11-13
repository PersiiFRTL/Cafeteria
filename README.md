# Sistema de gestión para cafetería

Sistema web de gestión interna para una cafetería.

## Tecnologías

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js
- Express

### Base de datos
- PostgreSQL mediante Supabase

## Probar el sistema en local

Para probar el sistema, inicia el frontend y el backend en terminales separadas desde la raíz del proyecto.

En una terminal:

```bash
cd frontend
npm run dev
```

En otra terminal:

```bash
cd backend
npm run dev
```

El frontend se abrirá en `http://localhost:5173` y el backend estará disponible en `http://localhost:3000`.

El backend carga la configuración de `backend/.env` y expone el estado de la conexión en `http://localhost:3000/api/health/supabase`. En desarrollo, Vite también lee de ese archivo únicamente las variables con prefijo `VITE_`. La clave publishable puede usarse en el navegador; no se debe colocar una clave `service_role` en el frontend.

### Pruebas automatizadas del backend

Desde la carpeta `backend`, ejecuta:

```bash
npm test
```

Estas pruebas usan el ejecutor integrado de Node.js y no requieren conectarse a Supabase.

### Despliegue en producción

El backend se puede desplegar como contenedor desde `backend/` usando `backend/Dockerfile`, o en un host Node.js con `npm ci --omit=dev` y `npm start`. El proceso escucha en el puerto definido por `PORT` y el endpoint `GET /` sirve como comprobación de salud del servidor.

Configura estas variables en el servicio del backend:

- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_PUBLISHABLE_KEY`: clave pública del proyecto.
- `SUPABASE_SECRET_KEY`: necesaria para administrar cuentas de empleados. Solo debe existir en el backend.
- `FRONTEND_ORIGINS`: orígenes públicos exactos del frontend, separados por comas y sin barras finales.
- `TRUST_PROXY=1` solo si el host está detrás de exactamente un proxy confiable; en caso contrario, déjalo en `0`.
- `PORT`: lo asigna el proveedor en la mayoría de los hosts.

Para el frontend, ejecuta `npm ci` y `npm run build` desde `frontend/` y publica la carpeta `frontend/dist`. Define durante la compilación `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_API_BASE_URL` (la URL pública de Express, sin barra final). Si el frontend y el backend comparten origen y un proxy enruta `/api`, `VITE_API_BASE_URL` puede quedar vacío.

Luego verifica `GET /` en el backend, `GET /api/health/supabase`, el inicio de sesión y una operación protegida desde el dominio público. No uses `VITE_` para claves secretas.

## Supabase

El esquema está en `supabase\migrations\20261014190000_create_cafeteria_schema.sql`; los datos demo se pueden cargar desde SQL Editor con `supabase\migrations\20261014212644_seed_initial_cafeteria_data.sql`. Las migraciones posteriores deben ejecutarse en orden desde SQL Editor.

La autenticación se solicita al backend, que valida credenciales con Supabase Auth y obtiene el rol/nombre desde `public.perfiles`:

- `POST /api/auth/login`: inicia sesión y devuelve el perfil y los tokens de Supabase necesarios para las consultas protegidas del frontend.
- `GET /api/auth/session`: valida el token enviado como `Authorization: Bearer ...` y devuelve el perfil activo.
- `POST /api/auth/logout`: revoca la sesión en Supabase Auth.

Las operaciones transaccionales del negocio también pasan por Express y requieren el mismo Bearer token:

- Comandas: `POST /api/comandas`, `PATCH /api/comandas/:id`, `POST /api/comandas/:id/productos`, `POST /api/comandas/:id/procesar-stock`, `PATCH /api/comandas/:id/items/:productoId/estado`, `POST /api/comandas/:id/finalizar` y `POST /api/comandas/:id/cancelar`.
- Stock y producción: `POST /api/stock/movimientos` y `POST /api/producciones`.
- Mesas y mapa: `PUT /api/mapa` (incluye datos de mesa, elementos y IDs eliminados).

Estas rutas ejecutan las RPC transaccionales en Supabase con el token del usuario; los controles de rol y las reglas de negocio continúan aplicándose en PostgreSQL.

Los datos y el catálogo también se consultan y gestionan mediante Express, con el token del usuario y las políticas RLS:

- `GET /api/datos-iniciales`: carga productos, materias primas, recetas, mesas, mapa, comandas, stock, producción y auditoría cuando corresponde.
- Productos: `POST /api/productos`, `PATCH /api/productos/:id`, `PATCH /api/productos/:id/stock-minimo`, `PATCH /api/productos/:id/estado` y `DELETE /api/productos/:id`.
- Materias primas: `POST /api/materias-primas`, `PATCH /api/materias-primas/:id` y `PATCH /api/materias-primas/:id/estado`.
- Recetas: `PUT /api/recetas/:productoId`.

El frontend ya no consulta las tablas operativas de Supabase directamente. El SDK de Supabase en el navegador queda para mantener la sesión y enviar el token Bearer a Express.

La gestión de personal está limitada a administradores activos:

- `GET /api/perfiles/nombres`: devuelve únicamente IDs y nombres para identificar a quienes registraron comandas, movimientos y producciones. Requiere una sesión activa.
- `GET /api/empleados`: lista los perfiles.
- `POST /api/empleados`: crea un usuario de Auth y su perfil.
- `PATCH /api/empleados/:id`: actualiza nombre, email, rol y, opcionalmente, contraseña.
- `PATCH /api/empleados/:id/estado`: activa o desactiva el perfil.

Estas rutas requieren `SUPABASE_SECRET_KEY` en `backend/.env` para las operaciones de Auth Admin. La clave solo se usa en el servidor y nunca debe incluirse en Vite, el frontend o Git. El usuario de la solicitud se valida como administrador antes de ejecutar una operación privilegiada.

El historial de actividad registra quién creó o modificó comandas, productos, materias primas, recetas y empleados, además de los cambios de estado y operaciones de stock. Solo los administradores pueden consultarlo desde Informes. Su tabla y triggers se crean con `supabase\migrations\20261030150000_auditoria_actividad.sql`.

Las cuentas se crean en Supabase Auth; el trigger les asigna rol `EMPLEADO`. El rol `ADMINISTRADOR` se concede desde SQL Editor a la cuenta autorizada.

### Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@cafeteria.com` | `123456` |
| Empleado | `empleado@cafeteria.com` | `123456` |
| Cocina | `cocina@cafeteria.com` | `123456` |

Estas cuentas deben estar creadas en Supabase Auth. El trigger asigna inicialmente el rol `EMPLEADO`; para que la cuenta de administrador y la de cocina tengan los permisos correspondientes, configura sus roles en `public.perfiles`.
