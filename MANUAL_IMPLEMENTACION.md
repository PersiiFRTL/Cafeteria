# Manual de implementación

Guía para instalar, configurar, ejecutar y desplegar el sistema de gestión de cafetería. El proyecto tiene dos aplicaciones Node independientes: un frontend React/Vite y una API Express. PostgreSQL, autenticación y políticas de acceso se administran en Supabase.

## 1. Requisitos

- Git.
- Node.js 22.12 o superior (recomendado) y npm. Vite requiere Node 20.19+ o 22.12+.
- Un proyecto Supabase con acceso a **Project URL**, **Publishable key** y, para administrar cuentas desde la API, **Secret key**.
- Acceso al SQL Editor del proyecto Supabase para instalar las migraciones.

Node y npm se pueden comprobar con:

```bash
node --version
npm --version
```

## 2. Descargar el repositorio

En Windows PowerShell se usan los mismos comandos. Si el directorio clonado tiene otro nombre, entrá en ese directorio.

```bash
git clone https://github.com/PersiiFRTL/Cafeteria.git
cd Cafeteria
```

## 3. Instalar dependencias

El backend y el frontend tienen su propio `package.json` y archivo de bloqueo. Ejecutá `npm ci` en cada carpeta desde la raíz:

```bash
cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

`npm ci` instala las versiones fijadas en `package-lock.json`. Si estás desarrollando y modificás dependencias, usá `npm install` y guardá los cambios correspondientes en `package.json` y `package-lock.json`.

## 4. Crear el proyecto y configurar Supabase

### 4.1 Crear o seleccionar un proyecto

En Supabase, creá un proyecto PostgreSQL y guardá:

- **Project URL**, con formato `https://<id-del-proyecto>.supabase.co`.
- **Publishable key** (prefijo habitual `sb_publishable_`; en proyectos antiguos puede aparecer como `anon`). Esta clave se puede exponer en el navegador porque las tablas están protegidas con RLS.
- **Secret key** (prefijo habitual `sb_secret_`; en proyectos antiguos puede llamarse `service_role`). Solo se usa en el backend para operaciones administrativas de Auth; nunca la incluyas en el frontend, en variables `VITE_`, en documentación pública ni en Git.

No uses una clave secreta en lugar de la Publishable key del cliente. La clave secreta omite las políticas RLS.

### 4.2 Aplicar el esquema y las migraciones

Abrí **SQL Editor** en Supabase. En un proyecto vacío, copiá y ejecutá el contenido de cada archivo en el siguiente orden. Ejecutá un archivo por vez y confirmá que termine sin errores:

1. `supabase/migrations/20261014190000_create_cafeteria_schema.sql`
2. `supabase/migrations/20261014_restringir_lecturas_a_perfiles_activos.sql`
3. `supabase/migrations/20261016150000_catalogo_recetas_rpc.sql`
4. `supabase/migrations/20261016170000_persistencia_incremental_mapa.sql`
5. `supabase/migrations/20261017120000_comandas_stock_transaccional.sql`
6. `supabase/migrations/20261030150000_auditoria_actividad.sql`
7. `supabase/migrations/20261106120000_proteger_ultimo_administrador.sql`
8. `supabase/migrations/20261106180000_estado_manual_mesas.sql`
9. `supabase/migrations/20261113120000_edicion_comandas_en_preparacion.sql`
10. `supabase/migrations/20261113150000_procesar_stock_al_iniciar_item.sql`
11. `supabase/migrations/20261117090000_recetas_estado_activo.sql`
12. `supabase/migrations/20261118120000_performance_indexes_and_sales_report.sql`
13. `supabase/migrations/20261120160000_roles_permisos_modulares.sql`

La numeración determina el orden funcional. La última migración agrega roles configurables, traslada el rol de perfiles a una tabla relacionada y sustituye los controles de rol fijo por permisos modulares en RLS y RPC. Ejecutala después de las migraciones anteriores antes de iniciar la versión nueva de la API. No vuelvas a ejecutar una migración sobre una base que ya tiene ese esquema sin revisar primero qué cambios aplica. En una instalación existente, ejecutá únicamente las migraciones nuevas que todavía no se hayan aplicado y mantené un registro de ellas.

### 4.3 Datos de demostración (opcional)

Para una instalación de prueba nueva, podés ejecutar después de las migraciones el archivo `supabase/migrations/20261014212644_seed_initial_cafeteria_data.sql`. Carga mesas, productos, materias primas, recetas e inventario de demostración.

No lo ejecutes como mecanismo de actualización de producción: contiene IDs fijos y actualiza filas que coincidan con esos IDs. Los usuarios de prueba mencionados en el README no se crean con esta semilla; las cuentas de autenticación se crean por separado.

## 5. Configurar variables de entorno

### 5.1 Backend y desarrollo local

Creá el archivo `backend/.env` a partir de `backend/.env.example`.

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
notepad backend/.env
```

Linux/macOS:

```bash
cp backend/.env.example backend/.env
```

Completá, como mínimo, estas variables:

```dotenv
PORT=3000
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
TRUST_PROXY=0
PERF_LOG=0

SUPABASE_URL=https://<id-del-proyecto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_<clave-publicable>
SUPABASE_SECRET_KEY=sb_secret_<clave-secreta>
```

`SUPABASE_SECRET_KEY` es necesaria para crear usuarios y modificar sus credenciales desde la administración de empleados. No la configures si no necesitás esa operación, y nunca la copies al frontend.

### 5.2 Variables que usa Vite

El archivo `frontend/vite.config.ts` define `backend/` como `envDir`, así que durante el desarrollo Vite también lee `backend/.env`. Agregá allí las variables públicas del frontend, que aparecen en `frontend/.env.example`:

```dotenv
VITE_SUPABASE_URL=https://<id-del-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<clave-publicable>
VITE_API_BASE_URL=
```

En local, dejá `VITE_API_BASE_URL` vacío: Vite envía `/api` a `http://localhost:3000` mediante el proxy configurado. No agregues el prefijo `VITE_` a una clave secreta.

Los archivos `.env` están excluidos de Git. Conservá las claves en el gestor de secretos del host o en variables protegidas del entorno de compilación.

## 6. Crear las cuentas y asignar el primer administrador

1. En Supabase, abrí **Authentication → Users** y creá una cuenta para el administrador inicial.
2. Confirmá que la ejecución de la migración inicial creó su fila en `public.perfiles`. El trigger asigna de forma segura el rol `EMPLEADO` a las cuentas nuevas.
3. Desde SQL Editor, cambiá el rol de esa cuenta usando su correo real:

```sql
update public.perfiles
set rol = 'ADMINISTRADOR'
where email = 'admin@tu-dominio.com';
```

4. Comprobá que la consulta modificó exactamente una fila y que el correo corresponde a la cuenta autorizada. No habilites registro público de administradores.
5. Iniciá sesión en la aplicación con esa cuenta. Después, el administrador puede crear las cuentas de empleados desde la sección correspondiente.

La aplicación reconoce los roles `ADMINISTRADOR`, `EMPLEADO` y `COCINA`. No asignes privilegios administrativos desde metadatos enviados por el navegador.

## 7. Ejecutar en desarrollo

Abrí dos terminales en la raíz del repositorio.

Terminal 1, API:

```bash
cd backend
npm run dev
```

Terminal 2, frontend:

```bash
cd frontend
npm run dev
```

Vite muestra la URL disponible, normalmente `http://localhost:5173`. La API escucha en `http://localhost:3000`. No cierres la terminal del backend mientras usás el frontend.

## 8. Comprobar la instalación

Con ambos procesos en ejecución, comprobá:

1. API: abrí `http://localhost:3000/`; debe responder que el backend está funcionando.
2. Supabase: abrí `http://localhost:3000/api/health/supabase`; la respuesta debe indicar `configurado: true` y `conectado: true`.
3. Aplicación: abrí la URL de Vite, iniciá sesión con una cuenta creada y probá una acción protegida según su rol.
4. Administrador: comprobá catálogo, empleados, creación de roles y permisos, e Informes. En la versión nueva, Informes requiere el permiso `informes.ver` (que el rol base ADMINISTRADOR conserva).
5. Datos: verificá que las tablas y los datos cargados aparezcan según el perfil. Si el health check falla, revisá URL, Publishable key, conexión de red y estado del proyecto Supabase.

Las respuestas de la API usan `data` para los éxitos y `error` para los errores. Los endpoints, roles y contratos están descritos en `backend/API.md`.

## 9. Comandos de mantenimiento

Frontend, ejecutados desde `frontend/`:

```bash
npm run build
npm run lint
npm test
```

`npm run build` valida TypeScript y genera el sitio de producción en `frontend/dist`. `npm run lint` analiza el código fuente. `npm test` ejecuta las pruebas del frontend.

Backend, ejecutados desde `backend/`:

```bash
npm test
npm start
```

`npm test` usa el ejecutor de pruebas de Node.js. `npm start` inicia el servidor sin Nodemon. Las pruebas unitarias no requieren Supabase; la aplicación en ejecución sí necesita sus variables configuradas.

## 10. Preparar y desplegar en producción

El proyecto puede alojarse con un frontend estático y una API Node separada. No requiere publicar la base de datos: Supabase ofrece PostgreSQL y Auth como servicio. Configurá el frontend y la API con HTTPS y dominios definitivos.

### 10.1 Backend Node

Usá la carpeta `backend/` como directorio del servicio:

- Instalación: `npm ci --omit=dev`
- Inicio: `npm start` (o `node server.js`)
- Puerto: el indicado por `PORT` que proporcione el host.
- Health check: `GET /`.

Configurá en el entorno del servicio `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (si se administra personal), `FRONTEND_ORIGINS` y `TRUST_PROXY`. En `FRONTEND_ORIGINS` anotá los orígenes exactos, separados por comas y sin barra final, por ejemplo `https://cafeteria.ejemplo.com`. Dejá `TRUST_PROXY=0` salvo que el host esté detrás de exactamente un proxy confiable.

### 10.2 Backend en Docker

Desde la raíz del repositorio, construí la imagen usando `backend/` como contexto:

```bash
docker build -t cafeteria-api ./backend
```

Al ejecutar el contenedor, pasá las variables de Supabase y CORS desde el gestor de secretos del entorno. No copies `.env` dentro de la imagen. El contenedor expone el puerto 3000; en producción el host puede asignar otro mediante `PORT`.

### 10.3 Frontend estático

Durante el proceso de build, configurá las variables públicas `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_API_BASE_URL`. La última debe ser la URL HTTPS pública del backend, sin barra final, por ejemplo `https://api.ejemplo.com`. Si un proxy enruta `/api` desde el mismo dominio del frontend al backend, puede quedar vacía.

Desde `frontend/`:

```bash
npm ci
npm run build
```

Publicá el contenido de `frontend/dist` en un hosting estático. Configurá el hosting para servir `index.html` como fallback de las rutas de React y para enrutar las llamadas `/api` al backend si se utiliza un único dominio.

Las variables `VITE_*` quedan incorporadas al código público durante el build. Solo colocá allí la URL y la Publishable key; jamás pongas `SUPABASE_SECRET_KEY` ni contraseñas.

### 10.4 Verificación post despliegue

- `GET https://<api>/` responde correctamente.
- `GET https://<api>/api/health/supabase` reporta conexión.
- El origen público del frontend está incluido en `FRONTEND_ORIGINS`.
- El login y una ruta protegida funcionan en HTTPS.
- Un usuario empleado recibe `403` al intentar acceder a funciones administrativas, y un usuario sin sesión recibe `401`.
- Los refresh/rutas internas del frontend cargan correctamente.

## 11. Seguridad, respaldos y operación

- No subas archivos `.env`, claves, tokens ni contraseñas al repositorio. Si una clave secreta se expone, rotala en Supabase.
- Mantené RLS activa. La API valida el token y el perfil/rol; las operaciones de negocio sensibles usan políticas y RPC transaccionales en PostgreSQL.
- Antes de aplicar migraciones en producción, hacé un respaldo de la base y verificá la migración en una copia de prueba.
- El SQL Editor no mantiene por sí solo un historial de migraciones aplicado por este repositorio. Registrá qué archivos se aplicaron en cada entorno para no repetirlos.
- `PERF_LOG=1` activa logs de duración de endpoints. Usalo durante diagnóstico y apagalo si no necesitás esos datos en los logs habituales.
- `backend/API.md` documenta la interfaz HTTP. `backend/PERFORMANCE.md` reúne notas de rendimiento.

## 12. Resolución de problemas

| Síntoma | Qué revisar |
|---|---|
| El frontend avisa que faltan variables Supabase | `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` están en el entorno que usa Vite. En desarrollo, Vite lee `backend/.env`. Reiniciá Vite después de cambiar variables. |
| `GET /api/health/supabase` da `configurado: false` | `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` están cargadas en `backend/.env` o en el entorno del servicio. |
| Error CORS en navegador | Agregá el origen completo del frontend a `FRONTEND_ORIGINS` y reiniciá el backend. El origen no lleva ruta ni barra final. |
| Login válido pero no aparece el perfil | Confirmá que se aplicó la migración inicial, que el trigger está activo y que existe una fila activa en `public.perfiles` con el ID de `auth.users`. |
| Respuesta 401 | La sesión o el token expiró; volvé a iniciar sesión y revisá que el frontend llame al backend correcto. |
| Respuesta 403 | El perfil puede estar inactivo o su rol no permite la operación. Revisá `public.perfiles` y el contrato de `backend/API.md`. |
| Administración de empleados responde 503 | Configurá `SUPABASE_SECRET_KEY` en el backend y reiniciá el servicio. No la envíes al frontend. |
| Backend no inicia en Docker | Construí con `backend/` como contexto (`docker build -t cafeteria-api ./backend`) y confirmá que la imagen contenga el backend modular completo. |

## Referencias del repositorio

- Instalación rápida: `README.md`.
- Variables de ejemplo: `backend/.env.example` y `frontend/.env.example`.
- Contrato de API: `backend/API.md`.
- Migraciones y datos de demostración: `supabase/migrations/`.
