-- Indexes for chronological, paginated screens and date-range reports.
create index if not exists comandas_fecha_creacion_idx
  on public.comandas (fecha_creacion desc);

create index if not exists operaciones_stock_fecha_idx
  on public.operaciones_stock (fecha desc);

create index if not exists producciones_fecha_idx
  on public.producciones (fecha desc);

-- Aggregate large report ranges in PostgreSQL instead of transferring every
-- order and line item to the Node.js process.
create or replace function public.informe_ventas(
  p_desde timestamptz,
  p_hasta_exclusiva timestamptz
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ordenes as (
    select c.id, c.estado, c.fecha_creacion
    from public.comandas c
    where c.fecha_creacion >= p_desde
      and c.fecha_creacion < p_hasta_exclusiva
  ),
  items_finalizados as (
    select ci.producto_id,
           ci.nombre_producto,
           ci.cantidad,
           ci.precio_unitario,
           o.fecha_creacion
    from ordenes o
    join public.comanda_items ci on ci.comanda_id = o.id
    where o.estado = 'finalizada'
  ),
  ranking as (
    select producto_id as "productoId",
           min(nombre_producto) as nombre,
           sum(cantidad) as cantidad,
           sum(cantidad * precio_unitario) as ventas
    from items_finalizados
    group by producto_id
    order by sum(cantidad) desc, min(nombre_producto)
    limit 10
  ),
  dias as (
    select (fecha_creacion at time zone 'UTC')::date as fecha,
           sum(cantidad * precio_unitario) as ventas
    from items_finalizados
    group by (fecha_creacion at time zone 'UTC')::date
  )
  select jsonb_build_object(
    'totalComandas', (select count(*) from ordenes),
    'comandasFinalizadas', (select count(*) from ordenes where estado = 'finalizada'),
    'productosVendidos', coalesce((select sum(cantidad) from items_finalizados), 0),
    'ventasEstimadas', round(coalesce((select sum(cantidad * precio_unitario) from items_finalizados), 0), 2),
    'productosMasVendidos', coalesce((select jsonb_agg(to_jsonb(ranking)) from ranking), '[]'::jsonb),
    'ventasPorDia', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fecha', fecha,
        'comandas', (select count(*) from ordenes where (fecha_creacion at time zone 'UTC')::date = dias.fecha and estado = 'finalizada'),
        'ventas', round(ventas, 2)
      ) order by fecha)
      from dias
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.informe_ventas(timestamptz, timestamptz) from public, anon;
grant execute on function public.informe_ventas(timestamptz, timestamptz) to authenticated;
