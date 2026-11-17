# Contrato de la API

Todas las respuestas JSON usan un contrato común. Los éxitos devuelven `{ "data": ... }`; los listados paginados agregan `pagination` con `page`, `limit`, `total` y `totalPages`. Los errores devuelven `{ "error": { "code": "...", "message": "..." } }`. `details` puede aparecer en errores con información de validación.

Excepto `GET /` y `POST /api/auth/login`, las rutas requieren `Authorization: Bearer <access_token>`. El acceso administrativo además requiere rol `ADMINISTRADOR`. Los identificadores inexistentes responden `404`; payloads o filtros inválidos `400`; falta de sesión `401`; falta de permisos `403`; y fallos de dependencias `502` o `503`.

## Sesión y personal

| Método y ruta | Éxito | Respuesta `data` | Errores principales |
|---|---:|---|---|
| `GET /` | 200 | `{ mensaje }` | — |
| `GET /api/health/supabase` | 200/502/503 | estado de conexión | — |
| `POST /api/auth/login` | 200 | `{ usuario, session }` | 400 credenciales mal formadas; 401 credenciales incorrectas; 403 perfil inactivo; 503 autenticación caída |
| `GET /api/auth/session` | 200 | `{ usuario }` | 401 token ausente/inválido; 403 perfil inactivo; 503 verificación temporalmente caída |
| `POST /api/auth/logout` | 200 | `{ mensaje }` | 401 token ausente; 503 servicio de autenticación |
| `GET /api/empleados?page=1&limit=20` | 200 | lista de perfiles | 400 paginación inválida; 401/403 |
| `POST /api/empleados` | 201 | empleado creado | 400 datos inválidos; 401/403; 503 administración de cuentas |
| `PATCH /api/empleados/:id` | 200 | empleado actualizado | 400 datos inválidos; 404 empleado inexistente; 401/403 |
| `PATCH /api/empleados/:id/estado` | 200 | empleado actualizado | 400 estado/ID inválido; 401/403; 404 |

## Catálogo y operación

Los listados aceptan `page` (por defecto 1) y `limit` (por defecto 20, máximo 100). Devuelven las filas de Supabase en `data` con nombres de columna snake_case.

| Método y ruta | Filtros / cuerpo | Éxito | Errores principales |
|---|---|---:|---|
| `GET /api/productos` | `activo=true|false`, `disponible=true|false`, `sector=Cocina|Cafetería|Pastelería`, `tipoElaboracion=bajo_pedido|preelaborado|reventa`, paginación | 200 listado paginado | 400 filtros inválidos |
| `GET /api/productos/:id` | — | 200 producto | 400 ID inválido; 404 |
| `POST /api/productos` | nombre, precio, categoria, sector, tipoElaboracion | 201 producto | 400 validación |
| `PATCH /api/productos/:id` | reemplazo de los campos editables del producto | 200 producto | 400 validación; 404 |
| `PATCH /api/productos/:id/stock-minimo` | `{ stockMinimo }` | 200 producto | 400 validación; 404 |
| `PATCH /api/productos/:id/estado` | `{ activo }` | 200 estado | 400 validación; 404 |
| `DELETE /api/productos/:id` | — | 200 `{ id, mensaje }` | 400 ID inválido; 404 |
| `GET /api/materias-primas` | `activo=true|false`, paginación | 200 listado paginado | 400 filtros inválidos |
| `GET /api/materias-primas/:id` | — | 200 materia prima | 400 ID inválido; 404 |
| `POST /api/materias-primas` | nombre, categoria, unidad, stockMinimo, stockInicial | 201 materia prima | 400 validación |
| `PATCH /api/materias-primas/:id` | datos editables | 200 materia prima | 400 validación; 404 |
| `PATCH /api/materias-primas/:id/estado` | `{ activo }` | 200 estado | 400 validación; 404 |
| `GET /api/mesas` | paginación | 200 listado paginado | 400 paginación inválida |
| `GET /api/mesas/:id` | — | 200 mesa | 400 ID inválido; 404 |
| `PATCH /api/mesas/:id/estado` | `{ estado: "libre"|"ocupada" }` | 200 resultado | 400 validación |
| `GET /api/comandas` | `estado`, `mesaId`, `desde`, `hasta`, paginación | 200 listado paginado, más recientes primero | 400 filtros inválidos |
| `GET /api/comandas/:id` | — | 200 comanda con items | 400 ID inválido; 404 |
| `POST /api/comandas` | `mesaId`, `productos[]`; para take away también cliente y hora de retiro | 201 identificador/resultado de creación | 400 datos inválidos |
| `PATCH /api/comandas/:id` | `{ productos[] }` | 200 resultado de actualización | 400 datos inválidos |
| `POST /api/comandas/:id/productos` | `{ productos[] }` | 200 resultado de agregado | 400 datos inválidos |
| `POST /api/comandas/:id/procesar-stock` | — | 200 resultado idempotente de la operación | 400 ID inválido |
| `PATCH /api/comandas/:id/items/:productoId/estado` | `{ estado: "preparando"|"listo" }` | 200 resultado | 400 incluye estado ausente/inválido con mensaje descriptivo |
| `POST /api/comandas/:id/finalizar` | — | 200 resultado | 400 ID inválido |
| `POST /api/comandas/:id/cancelar` | — | 200 resultado | 400 ID inválido |
| `GET /api/recetas` | paginación | 200 listado paginado | 400 paginación inválida |
| `GET /api/recetas/:productoId` | — | 200 `{ id, producto_id, activo, ingredientes[] }` | 400 ID inválido; 404 sin receta |
| `PUT /api/recetas/:productoId` | `{ ingredientes: [{ materiaPrimaId, cantidad }] }` | 200 `{ id, productoId, ingredientes, reemplazoCompleto: true }` | 400 datos inválidos; 403 sin permisos |
| `PATCH /api/recetas/:productoId/estado` | `{ activo: true|false }` | 200 `{ id, producto_id, activo }` | 400 estado/ID inválido; 404 receta inexistente |
| `GET /api/perfiles/nombres` | — | 200 lista `{ id, nombre }` | 503 clave administrativa no configurada |
| `GET /api/mapa` | — | 200 `{ mesas, elementos }` | 401/403; 502 error de base |
| `PUT /api/mapa` | `{ mesas[], elementos[], idsEliminar[] }` | 200 resultado | 400 datos inválidos |

### Recetas

`PUT /api/recetas/:productoId` reemplaza la receta completa en una transacción del RPC `guardar_receta`: borra los ingredientes anteriores e inserta la lista recibida. La lista vacía `{"ingredientes":[]}` está permitida y deja la receta registrada sin ingredientes; no elimina el registro de receta. Deshabilitarla cambia `activo` a `false` y conserva sus ingredientes; volver a habilitarla cambia `activo` a `true`. Para consultar se usa `GET /api/recetas/:productoId`.

## Stock, producción e informes

| Método y ruta | Filtros / cuerpo | Éxito | Errores principales |
|---|---|---:|---|
| `GET /api/stock/movimientos` | `desde`, `hasta`, `tipo`, paginación | 200 operaciones con movimientos, orden descendente por fecha | 400 filtros inválidos |
| `POST /api/stock/movimientos` | un artículo, tipo entrada/salida, cantidad y descripción opcional | 201 movimiento | 400 datos inválidos |
| `GET /api/producciones` | `desde`, `hasta`, paginación | 200 producciones, orden descendente | 400 filtros inválidos |
| `POST /api/producciones` | `{ productoId, cantidad }` | 201 producción | 400 datos inválidos |
| `GET /api/informes/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | fechas obligatorias, inclusivas | 200 `{ totalComandas, comandasFinalizadas, productosVendidos, ventasEstimadas, productosMasVendidos[], ventasPorDia[] }` | 400 rango inválido; 502 error de base |
| `GET /api/auditoria` | `usuarioId`, `accion`, `desde`, `hasta`, paginación | 200 eventos paginados, más recientes primero | 400 filtros inválidos; 401/403 |

Los informes cuentan todas las comandas creadas en el rango. Ventas, unidades y ranking se calculan sobre comandas finalizadas y conservan los precios registrados en cada comanda. `ventasPorDia` agrupa por fecha de creación de la comanda.

## Carga inicial del frontend

`GET /api/datos-iniciales` fue retirado. El frontend carga cada recurso desde su endpoint y en paralelo. El contrato de los endpoints nuevos permite pedir páginas adicionales sin descargar todo el histórico de una sola respuesta.
