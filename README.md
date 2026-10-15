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

El backend carga la configuración de `backend/.env` y expone el estado de la conexión en `http://localhost:3000/api/health/supabase`. En desarrollo, Vite también lee de ese archivo únicamente las variables con prefijo `VITE_`, necesarias para Supabase Auth en el navegador. La clave publishable está diseñada para el cliente y las tablas deben protegerse con RLS.

## Supabase

El esquema está en `supabase\migrations\20261014190000_create_cafeteria_schema.sql`; los datos demo se pueden cargar desde SQL Editor con `supabase\migrations\20261014212644_seed_initial_cafeteria_data.sql`.

El inicio de sesión usa Supabase Auth y obtiene rol/nombre desde `public.perfiles`. Las cuentas se crean en Supabase Auth; el trigger les asigna rol `EMPLEADO`. El rol `ADMINISTRADOR` se concede desde SQL Editor a la cuenta autorizada.

### Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@cafeteria.com` | `123456` |
| Empleado | `empleado@cafeteria.com` | `123456` |
| Cocina | `cocina@cafeteria.com` | `123456` |

Estas cuentas deben estar creadas en Supabase Auth. El trigger asigna inicialmente el rol `EMPLEADO`; para que la cuenta de administrador y la de cocina tengan los permisos correspondientes, configura sus roles en `public.perfiles`.

Las demás pantallas todavía cargan y modifican datos mediante el repositorio de demostración. La lectura/escritura persistente de catálogo, comandas, stock, producción, mesas y mapa queda pendiente de migrar por etapas.
