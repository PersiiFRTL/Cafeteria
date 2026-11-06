-- Centraliza los cambios de perfiles y evita que operaciones concurrentes
-- desactiven o degraden al último administrador.
revoke insert, update, delete on public.perfiles from authenticated;
drop policy if exists perfiles_admin_insert on public.perfiles;
drop policy if exists perfiles_admin_update on public.perfiles;
drop policy if exists perfiles_admin_delete on public.perfiles;

create or replace function public.actualizar_perfil_empleado_seguro(
  p_empleado_id uuid,
  p_nombre text,
  p_email text,
  p_rol public.rol_empleado
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actual public.perfiles%rowtype;
begin
  if not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador activo puede gestionar empleados.' using errcode = '42501';
  end if;
  if p_nombre is null or length(btrim(p_nombre)) = 0 or length(btrim(p_nombre)) > 120
      or p_email is null or length(btrim(p_email)) > 254
      or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or p_rol is null then
    raise exception 'Nombre, email o rol no válidos.' using errcode = '22023';
  end if;

  -- El mismo bloqueo serializa cambios de rol y estado de administradores.
  perform pg_advisory_xact_lock(1867319, 5);
  select * into v_actual
  from public.perfiles
  where id = p_empleado_id
  for update;
  if not found then
    raise exception 'No se encontró el empleado.' using errcode = 'P0002';
  end if;
  if p_empleado_id = auth.uid() and p_rol <> 'ADMINISTRADOR' then
    raise exception 'No podés quitarte el rol de administrador desde tu propia cuenta.' using errcode = '22023';
  end if;
  if v_actual.activo and v_actual.rol = 'ADMINISTRADOR' and p_rol <> 'ADMINISTRADOR'
      and (select count(*) from public.perfiles where activo and rol = 'ADMINISTRADOR') <= 1 then
    raise exception 'Debe quedar al menos un administrador activo.' using errcode = '22023';
  end if;

  update public.perfiles
  set nombre = btrim(p_nombre), email = lower(btrim(p_email)), rol = p_rol
  where id = p_empleado_id
  returning * into v_actual;
  return to_jsonb(v_actual);
end;
$$;

create or replace function public.cambiar_estado_empleado_seguro(
  p_empleado_id uuid,
  p_activo boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actual public.perfiles%rowtype;
begin
  if not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador activo puede gestionar empleados.' using errcode = '42501';
  end if;
  if p_activo is null then
    raise exception 'El estado del empleado no es válido.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(1867319, 5);
  select * into v_actual
  from public.perfiles
  where id = p_empleado_id
  for update;
  if not found then
    raise exception 'No se encontró el empleado.' using errcode = 'P0002';
  end if;
  if p_empleado_id = auth.uid() and not p_activo then
    raise exception 'No podés desactivar tu propia cuenta.' using errcode = '22023';
  end if;
  if not p_activo and v_actual.activo and v_actual.rol = 'ADMINISTRADOR'
      and (select count(*) from public.perfiles where activo and rol = 'ADMINISTRADOR') <= 1 then
    raise exception 'Debe quedar al menos un administrador activo.' using errcode = '22023';
  end if;

  update public.perfiles
  set activo = p_activo
  where id = p_empleado_id
  returning * into v_actual;
  return to_jsonb(v_actual);
end;
$$;

revoke all on function public.actualizar_perfil_empleado_seguro(uuid, text, text, public.rol_empleado) from public, anon;
revoke all on function public.cambiar_estado_empleado_seguro(uuid, boolean) from public, anon;
grant execute on function public.actualizar_perfil_empleado_seguro(uuid, text, text, public.rol_empleado) to authenticated;
grant execute on function public.cambiar_estado_empleado_seguro(uuid, boolean) to authenticated;
