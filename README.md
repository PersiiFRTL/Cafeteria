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

## Usuarios de prueba

Para iniciar sesión en el entorno local, utiliza cualquiera de estas cuentas:

| Rol | Email | Contraseña |
|---------------|-----------------------|--------|
| Administrador | `admin@cafeteria.com` | `1234` |
| Empleado | `juan@cafeteria.com` | `1234` |
| Cocina | `carlos@cafeteria.com` | `1234` |

Estas credenciales son únicamente para pruebas locales. No las uses en producción.