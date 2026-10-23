-- Operaciones transaccionales para comandas y el stock que consumen.
-- Ejecutar completo una vez desde Supabase SQL Editor.

create or replace function public.crear_comanda(
  p_mesa_id bigint,
  p_productos jsonb,
  p_cliente_nombre text default null,
  p_cliente_telefono text default null,
  p_hora_retiro timestamptz default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comanda_id bigint;
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad numeric;
  v_producto public.productos%rowtype;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para crear comandas.' using errcode = '42501';
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
  if p_mesa_id is null and (length(btrim(coalesce(p_cliente_nombre, ''))) = 0 or p_hora_retiro is null) then
    raise exception 'El pedido take away requiere nombre y horario de retiro.' using errcode = '22023';
  end if;

  if p_mesa_id is not null then
    update public.mesas
    set estado = 'ocupada'
    where id = p_mesa_id and estado = 'libre';
    if not found then
      raise exception 'La mesa no existe o ya está ocupada.' using errcode = '23505';
    end if;
  end if;

  insert into public.comandas (
    tipo_atencion, mesa_id, cliente_nombre, cliente_telefono, hora_retiro, creada_por
  ) values (
    case when p_mesa_id is null then 'take-away'::public.tipo_atencion else 'mesa'::public.tipo_atencion end,
    p_mesa_id,
    case when p_mesa_id is null then btrim(p_cliente_nombre) else null end,
    case when p_mesa_id is null then nullif(btrim(coalesce(p_cliente_telefono, '')), '') else null end,
    case when p_mesa_id is null then p_hora_retiro else null end,
    auth.uid()
  ) returning id into v_comanda_id;

  for v_item in select value from jsonb_array_elements(p_productos)
  loop
    v_producto_id := (v_item ->> 'productoId')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    if v_cantidad <= 0 then
      raise exception 'Las cantidades deben ser mayores que cero.' using errcode = '22023';
    end if;

    select * into v_producto
    from public.productos
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

    insert into public.comanda_items (
      comanda_id, producto_id, nombre_producto, precio_unitario, cantidad
    ) values (
      v_comanda_id, v_producto.id, v_producto.nombre, v_producto.precio, v_cantidad
    );
  end loop;

  return v_comanda_id;
end;
$$;

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
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad numeric;
  v_producto public.productos%rowtype;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para editar comandas.' using errcode = '42501';
  end if;
  perform 1 from public.comandas where id = p_comanda_id and estado = 'pendiente' for update;
  if not found then
    raise exception 'Solo se pueden editar comandas pendientes.' using errcode = '22023';
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

  delete from public.comanda_items where comanda_id = p_comanda_id;
  for v_item in select value from jsonb_array_elements(p_productos)
  loop
    v_producto_id := (v_item ->> 'productoId')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    if v_cantidad <= 0 then
      raise exception 'Las cantidades deben ser mayores que cero.' using errcode = '22023';
    end if;
    select * into v_producto
    from public.productos
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
    insert into public.comanda_items (
      comanda_id, producto_id, nombre_producto, precio_unitario, cantidad
    ) values (
      p_comanda_id, v_producto.id, v_producto.nombre, v_producto.precio, v_cantidad
    );
  end loop;
end;
$$;

create or replace function public.agregar_productos_comanda(
  p_comanda_id bigint,
  p_productos jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_producto_id bigint;
  v_cantidad numeric;
  v_producto public.productos%rowtype;
  v_item_id bigint;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para modificar comandas.' using errcode = '42501';
  end if;
  perform 1 from public.comandas where id = p_comanda_id and estado = 'pendiente' for update;
  if not found then
    raise exception 'Solo se pueden agregar productos a comandas pendientes.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_productos) <> 'array' or jsonb_array_length(p_productos) = 0 then
    raise exception 'Agregá al menos un producto.' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_productos)
  loop
    v_producto_id := (v_item ->> 'productoId')::bigint;
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    if v_cantidad <= 0 then
      raise exception 'Las cantidades deben ser mayores que cero.' using errcode = '22023';
    end if;
    select * into v_producto
    from public.productos
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

    select id into v_item_id from public.comanda_items
    where comanda_id = p_comanda_id and producto_id = v_producto_id
    for update;
    if found then
      update public.comanda_items
      set cantidad = cantidad + v_cantidad, estado = 'pendiente'
      where id = v_item_id and comanda_id = p_comanda_id;
    else
      insert into public.comanda_items (
        comanda_id, producto_id, nombre_producto, precio_unitario, cantidad
      ) values (
        p_comanda_id, v_producto.id, v_producto.nombre, v_producto.precio, v_cantidad
      );
    end if;
  end loop;
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
  if v_estado in ('preparando', 'lista') then
    return true;
  end if;
  if v_estado <> 'pendiente' then
    raise exception 'La comanda no se puede enviar a preparación desde su estado actual.' using errcode = '22023';
  end if;

  insert into public.operaciones_stock (tipo, comanda_id, descripcion, creada_por)
  values ('comanda', p_comanda_id, 'Consumo por comanda #' || p_comanda_id, auth.uid())
  returning id into v_operacion_id;

  for v_item in
    select ci.id, ci.producto_id, ci.cantidad, ci.cantidad_stock_procesada
    from public.comanda_items ci
    where ci.comanda_id = p_comanda_id and ci.cantidad > ci.cantidad_stock_procesada
    order by ci.id
    for update
  loop
    v_cantidad_pendiente := v_item.cantidad - v_item.cantidad_stock_procesada;
    select * into v_producto from public.productos where id = v_item.producto_id for update;
    if not found then
      raise exception 'No se encontró un producto de la comanda.' using errcode = '22023';
    end if;

    if v_producto.tipo_elaboracion <> 'bajo_pedido' then
      update public.productos
      set stock_actual = stock_actual - v_cantidad_pendiente
      where id = v_producto.id and stock_actual >= v_cantidad_pendiente;
      if not found then
        raise exception 'Stock insuficiente de %.', v_producto.nombre using errcode = '22023';
      end if;
      insert into public.movimientos_stock (
        operacion_id, tipo, producto_id, cantidad, descripcion
      ) values (
        v_operacion_id, 'venta', v_producto.id, v_cantidad_pendiente,
        'Consumo por comanda #' || p_comanda_id
      );
      v_hay_movimientos := true;
    else
      if not exists (
        select 1 from public.recetas r join public.receta_ingredientes ri on ri.receta_id = r.id
        where r.producto_id = v_producto.id
      ) then
        raise exception 'El producto % no tiene una receta válida.', v_producto.nombre using errcode = '22023';
      end if;
      for v_ingrediente in
        select ri.materia_prima_id, ri.cantidad
        from public.recetas r
        join public.receta_ingredientes ri on ri.receta_id = r.id
        where r.producto_id = v_producto.id
        order by ri.materia_prima_id
      loop
        v_consumo := v_ingrediente.cantidad * v_cantidad_pendiente;
        update public.materias_primas
        set stock_actual = stock_actual - v_consumo
        where id = v_ingrediente.materia_prima_id and stock_actual >= v_consumo;
        if not found then
          raise exception 'Stock insuficiente de una materia prima para %.', v_producto.nombre using errcode = '22023';
        end if;
        insert into public.movimientos_stock (
          operacion_id, tipo, materia_prima_id, cantidad, descripcion
        ) values (
          v_operacion_id, 'consumo', v_ingrediente.materia_prima_id, v_consumo,
          'Consumo por comanda #' || p_comanda_id || ' · ' || v_producto.nombre
        );
        v_hay_movimientos := true;
      end loop;
    end if;

    update public.comanda_items
    set cantidad_stock_procesada = cantidad
    where id = v_item.id and comanda_id = p_comanda_id;
  end loop;

  if not v_hay_movimientos then
    delete from public.operaciones_stock where id = v_operacion_id;
  end if;
  update public.comandas
  set estado = 'preparando', inicio_preparacion = coalesce(inicio_preparacion, now())
  where id = p_comanda_id;

  return true;
end;
$$;

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

  if p_estado = 'preparando' and v_estado_comanda = 'pendiente' then
    perform public.procesar_stock_comanda(p_comanda_id);
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
    update public.comandas
    set estado = v_nuevo_estado
    where id = p_comanda_id;
  end if;
end;
$$;

create or replace function public.finalizar_comanda(p_comanda_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mesa_id bigint;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para finalizar comandas.' using errcode = '42501';
  end if;
  select mesa_id into v_mesa_id from public.comandas
  where id = p_comanda_id and estado = 'lista' for update;
  if not found then
    raise exception 'Solo se pueden finalizar comandas listas.' using errcode = '22023';
  end if;

  update public.comandas
  set estado = 'finalizada', fecha_finalizacion = now()
  where id = p_comanda_id and estado = 'lista';
  if v_mesa_id is not null then
    update public.mesas set estado = 'libre' where id = v_mesa_id;
  end if;
end;
$$;

create or replace function public.cancelar_comanda(p_comanda_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado public.estado_comanda;
  v_mesa_id bigint;
  v_operacion_id bigint;
  v_movimiento record;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para cancelar comandas.' using errcode = '42501';
  end if;
  select estado, mesa_id into v_estado, v_mesa_id
  from public.comandas where id = p_comanda_id for update;
  if not found or v_estado in ('finalizada', 'cancelada') then
    raise exception 'La comanda no se puede cancelar.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.operaciones_stock where comanda_id = p_comanda_id
  ) then
    insert into public.operaciones_stock (tipo, comanda_id, descripcion, creada_por)
    values ('comanda', p_comanda_id, 'Devolución por cancelación de comanda #' || p_comanda_id, auth.uid())
    returning id into v_operacion_id;

    for v_movimiento in
      select ms.producto_id, ms.materia_prima_id, ms.cantidad
      from public.operaciones_stock os
      join public.movimientos_stock ms on ms.operacion_id = os.id
      where os.comanda_id = p_comanda_id and os.id <> v_operacion_id
        and ms.tipo in ('venta', 'consumo')
      order by ms.id
    loop
      if v_movimiento.producto_id is not null then
        update public.productos
        set stock_actual = stock_actual + v_movimiento.cantidad
        where id = v_movimiento.producto_id;
        insert into public.movimientos_stock (
          operacion_id, tipo, producto_id, cantidad, descripcion
        ) values (
          v_operacion_id, 'ajuste', v_movimiento.producto_id, v_movimiento.cantidad,
          'Devolución por cancelación de comanda #' || p_comanda_id
        );
      else
        update public.materias_primas
        set stock_actual = stock_actual + v_movimiento.cantidad
        where id = v_movimiento.materia_prima_id;
        insert into public.movimientos_stock (
          operacion_id, tipo, materia_prima_id, cantidad, descripcion
        ) values (
          v_operacion_id, 'ajuste', v_movimiento.materia_prima_id, v_movimiento.cantidad,
          'Devolución por cancelación de comanda #' || p_comanda_id
        );
      end if;
    end loop;
  end if;

  update public.comandas
  set estado = 'cancelada', fecha_cancelacion = now()
  where id = p_comanda_id;
  if v_mesa_id is not null then
    update public.mesas set estado = 'libre' where id = v_mesa_id;
  end if;
end;
$$;

create or replace function public.registrar_movimiento_stock(
  p_materia_prima_id bigint,
  p_producto_id bigint,
  p_tipo public.tipo_movimiento,
  p_cantidad numeric,
  p_descripcion text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operacion_id bigint;
  v_tipo_operacion public.tipo_operacion;
  v_descripcion text := coalesce(nullif(btrim(p_descripcion), ''), 'Movimiento manual de stock');
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para registrar movimientos de stock.' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad <= 0 or num_nonnulls(p_materia_prima_id, p_producto_id) <> 1 then
    raise exception 'Los datos del movimiento no son válidos.' using errcode = '22023';
  end if;

  if p_materia_prima_id is not null then
    if p_tipo not in ('entrada', 'salida') then
      raise exception 'El movimiento de materia prima debe ser entrada o salida.' using errcode = '22023';
    end if;
    if p_tipo = 'entrada' then
      update public.materias_primas
      set stock_actual = stock_actual + p_cantidad
      where id = p_materia_prima_id and activo;
    else
      update public.materias_primas
      set stock_actual = stock_actual - p_cantidad
      where id = p_materia_prima_id and activo and stock_actual >= p_cantidad;
    end if;
  else
    if p_tipo <> 'entrada' then
      raise exception 'Solo se permiten entradas para productos de reventa.' using errcode = '22023';
    end if;
    update public.productos
    set stock_actual = stock_actual + p_cantidad
    where id = p_producto_id and activo and tipo_elaboracion = 'reventa';
  end if;
  if not found then
    raise exception 'El artículo no existe, está inactivo o no tiene stock suficiente.' using errcode = '22023';
  end if;

  v_tipo_operacion := case when p_tipo = 'entrada' then 'entrada'::public.tipo_operacion else 'salida'::public.tipo_operacion end;
  insert into public.operaciones_stock (tipo, descripcion, creada_por)
  values (v_tipo_operacion, v_descripcion, auth.uid())
  returning id into v_operacion_id;
  insert into public.movimientos_stock (
    operacion_id, tipo, materia_prima_id, producto_id, cantidad, descripcion
  ) values (
    v_operacion_id, p_tipo, p_materia_prima_id, p_producto_id, p_cantidad, v_descripcion
  );
  return v_operacion_id;
end;
$$;

create or replace function public.registrar_produccion(
  p_producto_id bigint,
  p_cantidad numeric
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_producto public.productos%rowtype;
  v_produccion_id bigint;
  v_operacion_id bigint;
  v_ingrediente record;
  v_consumo numeric;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']) then
    raise exception 'No tenés permisos para registrar producción.' using errcode = '42501';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad producida debe ser mayor que cero.' using errcode = '22023';
  end if;
  select * into v_producto from public.productos
  where id = p_producto_id and activo and tipo_elaboracion = 'preelaborado'
  for update;
  if not found then
    raise exception 'Solo se puede producir un producto preelaborado activo.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.recetas r join public.receta_ingredientes ri on ri.receta_id = r.id
    where r.producto_id = p_producto_id
  ) then
    raise exception 'El producto no tiene una receta válida.' using errcode = '22023';
  end if;

  insert into public.producciones (producto_id, cantidad, creada_por)
  values (p_producto_id, p_cantidad, auth.uid())
  returning id into v_produccion_id;
  insert into public.operaciones_stock (tipo, produccion_id, descripcion, creada_por)
  values ('produccion', v_produccion_id, 'Producción de ' || p_cantidad || ' ' || v_producto.nombre, auth.uid())
  returning id into v_operacion_id;

  for v_ingrediente in
    select ri.materia_prima_id, ri.cantidad
    from public.recetas r
    join public.receta_ingredientes ri on ri.receta_id = r.id
    where r.producto_id = p_producto_id
    order by ri.materia_prima_id
  loop
    v_consumo := v_ingrediente.cantidad * p_cantidad;
    update public.materias_primas
    set stock_actual = stock_actual - v_consumo
    where id = v_ingrediente.materia_prima_id and stock_actual >= v_consumo;
    if not found then
      raise exception 'No hay suficiente materia prima para producir %.', v_producto.nombre using errcode = '22023';
    end if;
    insert into public.movimientos_stock (
      operacion_id, tipo, materia_prima_id, cantidad, descripcion
    ) values (
      v_operacion_id, 'consumo', v_ingrediente.materia_prima_id, v_consumo,
      'Consumo por producción de ' || p_cantidad || ' ' || v_producto.nombre
    );
  end loop;

  update public.productos
  set stock_actual = stock_actual + p_cantidad
  where id = p_producto_id;
  insert into public.movimientos_stock (
    operacion_id, tipo, producto_id, cantidad, descripcion
  ) values (
    v_operacion_id, 'produccion', p_producto_id, p_cantidad,
    'Producción de ' || p_cantidad || ' ' || v_producto.nombre
  );
  return v_produccion_id;
end;
$$;

revoke all on function public.crear_comanda(bigint, jsonb, text, text, timestamptz) from public, anon;
revoke all on function public.editar_comanda(bigint, jsonb) from public, anon;
revoke all on function public.agregar_productos_comanda(bigint, jsonb) from public, anon;
revoke all on function public.procesar_stock_comanda(bigint) from public, anon;
revoke all on function public.cambiar_estado_item_comanda(bigint, bigint, public.estado_item) from public, anon;
revoke all on function public.finalizar_comanda(bigint) from public, anon;
revoke all on function public.cancelar_comanda(bigint) from public, anon;
revoke all on function public.registrar_movimiento_stock(bigint, bigint, public.tipo_movimiento, numeric, text) from public, anon;
revoke all on function public.registrar_produccion(bigint, numeric) from public, anon;
grant execute on function public.crear_comanda(bigint, jsonb, text, text, timestamptz) to authenticated;
grant execute on function public.editar_comanda(bigint, jsonb) to authenticated;
grant execute on function public.agregar_productos_comanda(bigint, jsonb) to authenticated;
grant execute on function public.procesar_stock_comanda(bigint) to authenticated;
grant execute on function public.cambiar_estado_item_comanda(bigint, bigint, public.estado_item) to authenticated;
grant execute on function public.finalizar_comanda(bigint) to authenticated;
grant execute on function public.cancelar_comanda(bigint) to authenticated;
grant execute on function public.registrar_movimiento_stock(bigint, bigint, public.tipo_movimiento, numeric, text) to authenticated;
grant execute on function public.registrar_produccion(bigint, numeric) to authenticated;

-- Las escrituras de comandas e inventario solo deben pasar por las funciones
-- anteriores para preservar atomicidad y auditoría del stock.
revoke insert, update, delete on public.comandas, public.comanda_items, public.operaciones_stock
  from authenticated;
revoke insert, update, delete on public.producciones from authenticated;
