begin;

insert into public.mesas (id, numero, capacidad, estado) values
  (1, 1, 4, 'libre'),
  (2, 2, 2, 'libre'),
  (3, 3, 4, 'libre'),
  (4, 4, 2, 'libre'),
  (5, 5, 4, 'libre'),
  (6, 6, 6, 'libre'),
  (7, 7, 4, 'libre'),
  (8, 8, 2, 'libre'),
  (9, 9, 8, 'libre')
on conflict (id) do update set
  numero = excluded.numero,
  capacidad = excluded.capacidad,
  estado = excluded.estado;

insert into public.productos
  (id, nombre, precio, categoria, sector, tipo_elaboracion, unidad_venta,
   stock_actual, stock_minimo, activo, disponible)
values
  (1, 'Tostado', 3500, 'Comida', 'Cocina', 'bajo_pedido', 'unidad', 0, 0, true, true),
  (2, 'Café con leche', 2500, 'Bebida', 'Cafetería', 'bajo_pedido', 'unidad', 0, 0, true, true),
  (3, 'Medialuna', 1200, 'Panificados', 'Pastelería', 'preelaborado', 'unidad', 30, 10, true, true),
  (4, 'Licuado', 3000, 'Bebida', 'Cafetería', 'bajo_pedido', 'unidad', 0, 0, true, true),
  (5, 'Hamburguesa', 5500, 'Comida', 'Cocina', 'bajo_pedido', 'unidad', 0, 0, true, true),
  (6, 'Porción de torta', 4000, 'Pastelería', 'Pastelería', 'preelaborado', 'porcion', 12, 4, true, true)
on conflict (id) do update set
  nombre = excluded.nombre,
  precio = excluded.precio,
  categoria = excluded.categoria,
  sector = excluded.sector,
  tipo_elaboracion = excluded.tipo_elaboracion,
  unidad_venta = excluded.unidad_venta,
  stock_actual = excluded.stock_actual,
  stock_minimo = excluded.stock_minimo,
  activo = excluded.activo,
  disponible = excluded.disponible;

insert into public.materias_primas
  (id, nombre, categoria, unidad, stock_actual, stock_minimo, activo)
values
  (1, 'Pan', 'Panificados', 'unidad', 80, 20, true),
  (2, 'Jamón', 'Fiambres', 'kg', 5, 2, true),
  (3, 'Queso', 'Lácteos', 'kg', 4, 2, true),
  (4, 'Café en grano', 'Bebidas', 'kg', 3, 1, true),
  (5, 'Leche', 'Lácteos', 'litro', 12, 5, true),
  (6, 'Harina', 'Panificados', 'kg', 8, 3, true),
  (7, 'Manteca', 'Lácteos', 'kg', 3, 1, true),
  (8, 'Azúcar', 'Almacén', 'kg', 5, 2, true),
  (9, 'Huevo', 'Lácteos', 'unidad', 30, 10, true)
on conflict (id) do update set
  nombre = excluded.nombre,
  categoria = excluded.categoria,
  unidad = excluded.unidad,
  stock_actual = excluded.stock_actual,
  stock_minimo = excluded.stock_minimo,
  activo = excluded.activo;

insert into public.recetas (id, producto_id) values
  (1, 2),
  (2, 1),
  (3, 3)
on conflict (id) do update set producto_id = excluded.producto_id;

insert into public.receta_ingredientes (receta_id, materia_prima_id, cantidad) values
  (1, 4, 0.018),
  (1, 5, 0.200),
  (2, 1, 2.000),
  (2, 2, 0.080),
  (2, 3, 0.060),
  (3, 6, 0.040),
  (3, 7, 0.010),
  (3, 8, 0.008),
  (3, 9, 0.200)
on conflict (receta_id, materia_prima_id)
do update set cantidad = excluded.cantidad;

-- Registra el inventario inicial una sola vez en el historial.
do $$
declare
  operacion_id bigint;
begin
  if not exists (
    select 1 from public.operaciones_stock
    where tipo = 'entrada'
      and descripcion = 'Carga inicial desde datos de demostración'
  ) then
    insert into public.operaciones_stock (tipo, descripcion)
    values ('entrada', 'Carga inicial desde datos de demostración')
    returning id into operacion_id;

    insert into public.movimientos_stock
      (operacion_id, tipo, producto_id, cantidad, descripcion)
    values
      (operacion_id, 'entrada', 3, 30, 'Stock inicial'),
      (operacion_id, 'entrada', 6, 12, 'Stock inicial');

    insert into public.movimientos_stock
      (operacion_id, tipo, materia_prima_id, cantidad, descripcion)
    values
      (operacion_id, 'entrada', 1, 80, 'Stock inicial'),
      (operacion_id, 'entrada', 2, 5, 'Stock inicial'),
      (operacion_id, 'entrada', 3, 4, 'Stock inicial'),
      (operacion_id, 'entrada', 4, 3, 'Stock inicial'),
      (operacion_id, 'entrada', 5, 12, 'Stock inicial'),
      (operacion_id, 'entrada', 6, 8, 'Stock inicial'),
      (operacion_id, 'entrada', 7, 3, 'Stock inicial'),
      (operacion_id, 'entrada', 8, 5, 'Stock inicial'),
      (operacion_id, 'entrada', 9, 30, 'Stock inicial');
  end if;
end;
$$;

-- Avanza las secuencias para que las próximas altas no choquen con los IDs importados.
select setval(pg_get_serial_sequence('public.mesas', 'id'),
              (select coalesce(max(id), 1) from public.mesas), true);
select setval(pg_get_serial_sequence('public.productos', 'id'),
              (select coalesce(max(id), 1) from public.productos), true);
select setval(pg_get_serial_sequence('public.materias_primas', 'id'),
              (select coalesce(max(id), 1) from public.materias_primas), true);
select setval(pg_get_serial_sequence('public.recetas', 'id'),
              (select coalesce(max(id), 1) from public.recetas), true);

commit;
