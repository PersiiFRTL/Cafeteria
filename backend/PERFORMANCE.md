# Auditoría de rendimiento

## Hallazgos del recorrido

- El inicio de sesión ya devuelve un perfil validado; al guardar la sesión, el evento `SIGNED_IN` volvía a llamar `GET /api/auth/session`. Se omite únicamente ese evento para el token que acaba de validar `/login`.
- Antes, cada endpoint autenticado hacía `auth.getUser()` seguido por una consulta a `perfiles`: dos viajes secuenciales a Supabase por petición. Ahora el backend obtiene `sub` del JWT como clave de búsqueda y ejecuta directamente la consulta del perfil con ese mismo bearer token. Supabase verifica la firma y vencimiento y RLS limita la lectura a `auth.uid()`. No hay una caché de autorización.
- La carga inicial dispara diez endpoints concurrentes, y cada llamada repetía la obtención local de sesión en el navegador y la validación backend. Las lecturas locales de sesión y de autorización ahora se comparten sólo mientras esa ráfaga concurrente está activa.
- Después de una escritura el cliente volvía a cargar las diez colecciones. El estado de pantalla ya se actualiza de forma optimista; el refresco ahora solicita sólo auditoría y, para movimientos de inventario, sus historiales. Productos, recetas, comandas y mesas no se descargan de nuevo sin necesidad.
- Las listas de catálogo, comandas, movimientos y producción seleccionan las columnas usadas por la interfaz. Los informes agregan sobre todo el rango en PostgreSQL con `informe_ventas`, en vez de mover todas las comandas y líneas a Node. La implementación antigua queda como compatibilidad mientras la función SQL no esté instalada.

## Cómo medir una instalación

`PERF_LOG=1` activa logs JSON por endpoint con `durationMs` y `authMs`. Compará las mismas rutas antes/después y revisá particularmente `/api/auth/login`, `/api/auth/session`, endpoints de comandos/stock y `/api/informes/ventas`. En el navegador, Network permite comparar el número de peticiones al guardar una operación y sus tiempos de espera.

No se ejecutaron mediciones contra el proyecto Supabase conectado; las mejoras de cantidad de peticiones y columnas se deducen de las rutas/código, y el tiempo real dependerá de la latencia de red y base. Aplicá `20261118120000_performance_indexes_and_sales_report.sql` para habilitar índices y agregación SQL; si no se aplica, el endpoint de informe conserva temporalmente su implementación anterior.
