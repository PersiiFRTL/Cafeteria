-- Al comenzar un producto en cocina, procesa cualquier cantidad agregada aún
-- pendiente de stock dentro de la misma transacción que cambia su estado.
create or replace function public.cambiar_estado_item_comanda(
  p_comanda_id bigint,
  p_producto_id bigint,
  p_estado public.estado_item
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado_comanda public.estado_comanda;
  v_estado_item public.estado_item;
  v_nuevo_estado public.estado_comanda;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']) then
    raise exception 'No tenés permisos para cambiar el estado de preparación.' using errcode = '42501';
  end if;

  select estado into v_estado_comanda from public.comandas
  where id = p_comanda_id for update;
  if not found or v_estado_comanda in ('finalizada', 'cancelada') then
    raise exception 'La comanda no está activa.' using errcode = '22023';
  end if;

  select estado into v_estado_item from public.comanda_items
  where comanda_id = p_comanda_id and producto_id = p_producto_id
  order by id limit 1 for update;
  if not found then
    raise exception 'No se encontró el producto en la comanda.' using errcode = 'P0002';
  end if;
  if p_estado = 'preparando' and v_estado_item <> 'pendiente' then
    raise exception 'El producto ya no está pendiente.' using errcode = '22023';
  end if;
  if p_estado = 'listo' and v_estado_item <> 'preparando' then
    raise exception 'Primero hay que comenzar la preparación del producto.' using errcode = '22023';
  end if;

  if p_estado = 'preparando' then
    -- procesa solo cantidades aún no descontadas; repetir nunca duplica stock.
    perform public.procesar_stock_comanda(p_comanda_id);
  end if;

  update public.comanda_items
  set estado = p_estado
  where comanda_id = p_comanda_id and producto_id = p_producto_id;

  if not exists (
    select 1 from public.comanda_items where comanda_id = p_comanda_id and estado <> 'listo'
  ) then
    v_nuevo_estado := 'lista';
    update public.comandas
    set estado = v_nuevo_estado, fecha_lista = coalesce(fecha_lista, now())
    where id = p_comanda_id;
  else
    v_nuevo_estado := 'preparando';
    update public.comandas set estado = v_nuevo_estado where id = p_comanda_id;
  end if;
end;
$$;
