-- Operaciones atómicas para crear insumos con saldo inicial y guardar recetas.
-- Ejecutar una vez en Supabase SQL Editor.

create or replace function public.crear_materia_prima(
  p_nombre text,
  p_categoria text,
  p_unidad public.unidad_stock,
  p_stock_minimo numeric,
  p_stock_inicial numeric
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_materia_id bigint;
  v_operacion_id bigint;
begin
  if not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'No tenés permisos para crear materias primas.' using errcode = '42501';
  end if;
  if length(btrim(p_nombre)) = 0 or length(btrim(p_categoria)) = 0
     or p_stock_minimo < 0 or p_stock_inicial < 0 then
    raise exception 'Los datos de la materia prima no son válidos.' using errcode = '22023';
  end if;

  insert into public.materias_primas
    (nombre, categoria, unidad, stock_actual, stock_minimo)
  values
    (btrim(p_nombre), btrim(p_categoria), p_unidad, 0, p_stock_minimo)
  returning id into v_materia_id;

  if p_stock_inicial > 0 then
    insert into public.operaciones_stock (tipo, descripcion, creada_por)
    values ('entrada', 'Stock inicial de ' || btrim(p_nombre), auth.uid())
    returning id into v_operacion_id;

    insert into public.movimientos_stock
      (operacion_id, tipo, materia_prima_id, cantidad, descripcion)
    values
      (v_operacion_id, 'entrada', v_materia_id, p_stock_inicial, 'Stock inicial');

    update public.materias_primas
    set stock_actual = p_stock_inicial
    where id = v_materia_id;
  end if;

  return v_materia_id;
end;
$$;

create or replace function public.guardar_receta(
  p_producto_id bigint,
  p_ingredientes jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receta_id bigint;
  v_ingrediente jsonb;
begin
  if not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'No tenés permisos para editar recetas.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_ingredientes) <> 'array' then
    raise exception 'La lista de ingredientes no es válida.' using errcode = '22023';
  end if;

  insert into public.recetas (producto_id)
  values (p_producto_id)
  on conflict (producto_id) do update set producto_id = excluded.producto_id
  returning id into v_receta_id;

  delete from public.receta_ingredientes where receta_id = v_receta_id;

  for v_ingrediente in select value from jsonb_array_elements(p_ingredientes)
  loop
    insert into public.receta_ingredientes
      (receta_id, materia_prima_id, cantidad)
    values (
      v_receta_id,
      (v_ingrediente ->> 'materiaPrimaId')::bigint,
      (v_ingrediente ->> 'cantidad')::numeric
    );
  end loop;

  return v_receta_id;
end;
$$;

revoke all on function public.crear_materia_prima(text, text, public.unidad_stock, numeric, numeric)
  from public, anon;
revoke all on function public.guardar_receta(bigint, jsonb) from public, anon;
grant execute on function public.crear_materia_prima(text, text, public.unidad_stock, numeric, numeric)
  to authenticated;
grant execute on function public.guardar_receta(bigint, jsonb) to authenticated;