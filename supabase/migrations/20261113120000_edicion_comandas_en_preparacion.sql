-- Permite ajustar una comanda activa conservando lo ya preparado y procesado.
create or replace function public.editar_comanda(
  p_comanda_id bigint,
  p_productos jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado public.estado_comanda;
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad numeric;
  v_producto public.productos%rowtype;
  v_item_actual public.comanda_items%rowtype;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para editar comandas.' using errcode = '42501';
  end if;
  select estado into v_estado from public.comandas where id = p_comanda_id for update;
  if not found or v_estado not in ('pendiente', 'preparando') then
    raise exception 'Solo se pueden editar comandas pendientes o en preparación.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_productos) <> 'array' or jsonb_array_length(p_productos) = 0 then
    raise exception 'La comanda debe incluir al menos un producto.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_productos) item
    group by (item.value ->> 'productoId')
    having count(*) > 1
  ) then
    raise exception 'No repitas productos en la comanda.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_productos)
  loop
    v_producto_id := (v_item ->> 'productoId')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    if v_cantidad <= 0 then
      raise exception 'Las cantidades deben ser mayores que cero.' using errcode = '22023';
    end if;
    select * into v_producto from public.productos
    where id = v_producto_id and activo and disponible;
    if not found then
      raise exception 'Hay un producto inexistente o no disponible (ID %).', v_producto_id using errcode = '22023';
    end if;
    if v_producto.tipo_elaboracion = 'bajo_pedido' and not exists (
      select 1 from public.recetas r join public.receta_ingredientes ri on ri.receta_id = r.id
      where r.producto_id = v_producto_id
    ) then
      raise exception 'El producto % no tiene una receta válida.', v_producto.nombre using errcode = '22023';
    end if;

    select * into v_item_actual from public.comanda_items
    where comanda_id = p_comanda_id and producto_id = v_producto_id for update;
    if found then
      if v_cantidad < v_item_actual.cantidad_stock_procesada then
        raise exception 'No se puede reducir % por debajo de la cantidad ya enviada a preparación (%).',
          v_item_actual.nombre_producto, v_item_actual.cantidad_stock_procesada using errcode = '22023';
      end if;
      update public.comanda_items
      set cantidad = v_cantidad,
          estado = case when v_cantidad > v_item_actual.cantidad then 'pendiente'::public.estado_item else estado end
      where id = v_item_actual.id;
    else
      insert into public.comanda_items (comanda_id, producto_id, nombre_producto, precio_unitario, cantidad)
      values (p_comanda_id, v_producto.id, v_producto.nombre, v_producto.precio, v_cantidad);
    end if;
  end loop;

  -- Solo se eliminan renglones que todavía no consumieron stock.
  delete from public.comanda_items ci
  where ci.comanda_id = p_comanda_id
    and ci.cantidad_stock_procesada = 0
    and not exists (
      select 1 from jsonb_array_elements(p_productos) item
      where (item.value ->> 'productoId')::bigint = ci.producto_id
    );
  if exists (
    select 1 from public.comanda_items ci
    where ci.comanda_id = p_comanda_id and ci.cantidad_stock_procesada > 0
      and not exists (
        select 1 from jsonb_array_elements(p_productos) item
        where (item.value ->> 'productoId')::bigint = ci.producto_id
      )
  ) then
    raise exception 'No se puede quitar un producto cuyo stock ya fue procesado.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.procesar_stock_comanda(p_comanda_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado public.estado_comanda;
  v_item record;
  v_producto public.productos%rowtype;
  v_ingrediente record;
  v_operacion_id bigint;
  v_cantidad_pendiente numeric;
  v_consumo numeric;
  v_hay_movimientos boolean := false;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']) then
    raise exception 'No tenés permisos para iniciar la preparación.' using errcode = '42501';
  end if;
  select estado into v_estado from public.comandas where id = p_comanda_id for update;
  if not found then
    raise exception 'No se encontró la comanda.' using errcode = 'P0002';
  end if;
  if v_estado = 'lista' then return true; end if;
  if v_estado not in ('pendiente', 'preparando') then
    raise exception 'La comanda no se puede enviar a preparación desde su estado actual.' using errcode = '22023';
  end if;

  insert into public.operaciones_stock (tipo, comanda_id, descripcion, creada_por)
  values ('comanda', p_comanda_id, 'Consumo por comanda #' || p_comanda_id, auth.uid())
  returning id into v_operacion_id;

  for v_item in
    select ci.id, ci.producto_id, ci.cantidad, ci.cantidad_stock_procesada
    from public.comanda_items ci
    where ci.comanda_id = p_comanda_id and ci.cantidad > ci.cantidad_stock_procesada
    order by ci.id for update
  loop
    v_cantidad_pendiente := v_item.cantidad - v_item.cantidad_stock_procesada;
    select * into v_producto from public.productos where id = v_item.producto_id for update;
    if not found then raise exception 'No se encontró un producto de la comanda.' using errcode = '22023'; end if;

    if v_producto.tipo_elaboracion <> 'bajo_pedido' then
      update public.productos set stock_actual = stock_actual - v_cantidad_pendiente
      where id = v_producto.id and stock_actual >= v_cantidad_pendiente;
      if not found then raise exception 'Stock insuficiente de %.', v_producto.nombre using errcode = '22023'; end if;
      insert into public.movimientos_stock (operacion_id, tipo, producto_id, cantidad, descripcion)
      values (v_operacion_id, 'venta', v_producto.id, v_cantidad_pendiente, 'Consumo por comanda #' || p_comanda_id);
      v_hay_movimientos := true;
    else
      if not exists (select 1 from public.recetas r join public.receta_ingredientes ri on ri.receta_id = r.id where r.producto_id = v_producto.id) then
        raise exception 'El producto % no tiene una receta válida.', v_producto.nombre using errcode = '22023';
      end if;
      for v_ingrediente in
        select ri.materia_prima_id, ri.cantidad from public.recetas r
        join public.receta_ingredientes ri on ri.receta_id = r.id
        where r.producto_id = v_producto.id order by ri.materia_prima_id
      loop
        v_consumo := v_ingrediente.cantidad * v_cantidad_pendiente;
        update public.materias_primas set stock_actual = stock_actual - v_consumo
        where id = v_ingrediente.materia_prima_id and stock_actual >= v_consumo;
        if not found then raise exception 'Stock insuficiente de una materia prima para %.', v_producto.nombre using errcode = '22023'; end if;
        insert into public.movimientos_stock (operacion_id, tipo, materia_prima_id, cantidad, descripcion)
        values (v_operacion_id, 'consumo', v_ingrediente.materia_prima_id, v_consumo,
          'Consumo por comanda #' || p_comanda_id || ' · ' || v_producto.nombre);
        v_hay_movimientos := true;
      end loop;
    end if;
    update public.comanda_items set cantidad_stock_procesada = cantidad where id = v_item.id and comanda_id = p_comanda_id;
  end loop;

  if not v_hay_movimientos then delete from public.operaciones_stock where id = v_operacion_id; end if;
  update public.comandas set estado = 'preparando', inicio_preparacion = coalesce(inicio_preparacion, now())
  where id = p_comanda_id;
  return true;
end;
$$;
