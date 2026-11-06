# Tareas pendientes

## Frontend
- [ ] Que las mesas se puedan poner en el estado de ocupado sin tener una comanda, ya que se puede usar esa mesa para agrandar otra mesa
- [ ] Quiero que agregar un filtro mas a comandas y preparacion, que sea el de pendientes y en preparacion. que sea un filtro conjunto de estos dos estados.
- [ ] Agregar mas informacion a informes
- [ ] Poner otro icono mas acorde
- [ ] fixear la PWA

## Backend e integración
- [x] Conectar Express con Supabase y exponer el estado de conexión.
- [x] Persistir comandas, take away, stock, producción, mesas y mapa mediante RPC transaccionales.
- [x] Agregar endpoints Express para login, validación de sesión y logout.
- [x] Exponer las operaciones transaccionales de comandas, stock, producción y mapa mediante Express.
- [x] Persistir la gestión de empleados en perfiles y Supabase Auth con acceso exclusivo de administrador.
- [x] Registrar y consultar responsables de cambios en comandas, catálogo, stock, recetas y empleados.
- [ ] Revisar si conviene migrar el CRUD simple de catálogo a Express; actualmente se protege con RLS desde el cliente Supabase.
- [x] Agregar pruebas automatizadas iniciales para disponibilidad, validación y autenticación de endpoints del backend.
