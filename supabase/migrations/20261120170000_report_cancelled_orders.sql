-- Agrega el agregado de comandas canceladas utilizado por las tarjetas de resumen del informe.
create or replace function public.informe_ventas(p_desde timestamptz,p_hasta_exclusiva timestamptz)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_resultado jsonb;
begin
  if not public.tiene_permiso('informes','ver') then
    raise exception 'No tenés permiso para ver informes.' using errcode='42501';
  end if;
  with ordenes as (
    select c.id,c.estado,c.fecha_creacion
    from public.comandas c
    where c.fecha_creacion>=p_desde and c.fecha_creacion<p_hasta_exclusiva
  ), items_finalizados as (
    select ci.producto_id,ci.nombre_producto,ci.cantidad,ci.precio_unitario,o.fecha_creacion
    from ordenes o
    join public.comanda_items ci on ci.comanda_id=o.id
    where o.estado='finalizada'
  ), ranking as (
    select producto_id as "productoId",min(nombre_producto) as nombre,
      sum(cantidad) as cantidad,sum(cantidad*precio_unitario) as ventas
    from items_finalizados
    group by producto_id
    order by sum(cantidad) desc,min(nombre_producto)
    limit 10
  ), dias as (
    select (fecha_creacion at time zone 'UTC')::date as fecha,
      sum(cantidad*precio_unitario) as ventas
    from items_finalizados
    group by (fecha_creacion at time zone 'UTC')::date
  )
  select jsonb_build_object(
    'totalComandas',(select count(*) from ordenes),
    'comandasFinalizadas',(select count(*) from ordenes where estado='finalizada'),
    'comandasCanceladas',(select count(*) from ordenes where estado='cancelada'),
    'productosVendidos',coalesce((select sum(cantidad) from items_finalizados),0),
    'ventasEstimadas',round(coalesce((select sum(cantidad*precio_unitario) from items_finalizados),0),2),
    'productosMasVendidos',coalesce((select jsonb_agg(to_jsonb(ranking)) from ranking),'[]'::jsonb),
    'ventasPorDia',coalesce((select jsonb_agg(jsonb_build_object(
      'fecha',fecha,
      'comandas',(select count(*) from ordenes where (fecha_creacion at time zone 'UTC')::date=dias.fecha and estado='finalizada'),
      'ventas',round(ventas,2)
    ) order by fecha) from dias),'[]'::jsonb)
  ) into v_resultado;
  return v_resultado;
end;
$$;
revoke all on function public.informe_ventas(timestamptz,timestamptz) from public,anon;
grant execute on function public.informe_ventas(timestamptz,timestamptz) to authenticated;
