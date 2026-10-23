-- Guarda la numeración/aforo y elementos del mapa de forma transaccional.
-- Solo borra los elementos cuyos IDs envía explícitamente la acción del usuario.
-- No modifica el estado libre/ocupada de las mesas.

create or replace function public.guardar_mapa(
  p_mesas jsonb,
  p_elementos jsonb,
  p_ids_eliminar text[] default array[]::text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mesa jsonb;
  v_elemento jsonb;
  v_desplazamiento integer;
  v_id_eliminar text;
  v_mesa_id bigint;
  v_elemento_id text;
begin
  if not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'No tenés permisos para editar el mapa.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_mesas) <> 'array' or jsonb_typeof(p_elementos) <> 'array' then
    raise exception 'Los datos del mapa no son válidos.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.mesas existente
    where not exists (
      select 1 from jsonb_array_elements(p_mesas) entrada
      where (entrada.value ->> 'id')::bigint = existente.id
    )
  ) then
    raise exception 'El mapa debe incluir todas las mesas existentes.' using errcode = '22023';
  end if;

  -- Reserva temporalmente números únicos dentro de esta transacción para permitir reordenar.
  select coalesce(max(numero), 0) + jsonb_array_length(p_mesas) + 1
    into v_desplazamiento
  from public.mesas;
  -- Cambia los números uno por uno con una condición por ID. Esto evita
  -- actualizaciones globales y colisiones con la restricción UNIQUE(numero).
  for v_mesa in select value from jsonb_array_elements(p_mesas)
  loop
    update public.mesas
    set numero = numero + v_desplazamiento
    where id = (v_mesa ->> 'id')::bigint;
  end loop;

  for v_mesa in select value from jsonb_array_elements(p_mesas)
  loop
    v_mesa_id := (v_mesa ->> 'id')::bigint;
    update public.mesas
    set numero = (v_mesa ->> 'numero')::integer,
        capacidad = (v_mesa ->> 'capacidad')::integer
    where id = v_mesa_id;

    if not found then
      insert into public.mesas (id, numero, capacidad, estado)
      values (
        v_mesa_id,
        (v_mesa ->> 'numero')::integer,
        (v_mesa ->> 'capacidad')::integer,
        'libre'
      );
    end if;
  end loop;

  foreach v_id_eliminar in array coalesce(p_ids_eliminar, array[]::text[])
  loop
    delete from public.elementos_mapa where id = v_id_eliminar;
  end loop;

  for v_elemento in select value from jsonb_array_elements(p_elementos)
  loop
    v_elemento_id := v_elemento ->> 'id';
    update public.elementos_mapa
    set tipo = (v_elemento ->> 'tipo')::public.tipo_elemento_mapa,
        x = (v_elemento ->> 'x')::numeric,
        y = (v_elemento ->> 'y')::numeric,
        ancho = (v_elemento ->> 'ancho')::numeric,
        alto = (v_elemento ->> 'alto')::numeric,
        rotacion = (v_elemento ->> 'rotacion')::numeric,
        mesa_id = nullif(v_elemento ->> 'mesaId', '')::bigint,
        grosor = nullif(v_elemento ->> 'grosor', '')::numeric
    where id = v_elemento_id;

    if not found then
      insert into public.elementos_mapa
        (id, tipo, x, y, ancho, alto, rotacion, mesa_id, grosor)
      values (
        v_elemento_id,
        (v_elemento ->> 'tipo')::public.tipo_elemento_mapa,
        (v_elemento ->> 'x')::numeric,
        (v_elemento ->> 'y')::numeric,
        (v_elemento ->> 'ancho')::numeric,
        (v_elemento ->> 'alto')::numeric,
        (v_elemento ->> 'rotacion')::numeric,
        nullif(v_elemento ->> 'mesaId', '')::bigint,
        nullif(v_elemento ->> 'grosor', '')::numeric
      );
    end if;
  end loop;

  perform setval(
    pg_get_serial_sequence('public.mesas', 'id'),
    coalesce((select max(id) from public.mesas), 1),
    true
  );
end;
$$;

revoke all on function public.guardar_mapa(jsonb, jsonb, text[]) from public, anon;
grant execute on function public.guardar_mapa(jsonb, jsonb, text[]) to authenticated;
