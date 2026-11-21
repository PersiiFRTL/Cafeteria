-- Roles configurables y permisos por módulo.
begin;

create or replace function public.permisos_rol_validos(p_permisos jsonb)
returns boolean language plpgsql immutable set search_path = ''
as $$
declare
  v_modulo text;
  v_modulos text[] := array['dashboard','mesas','comandas','nueva-comanda','preparacion','productos','materias-primas','stock','produccion','recetas','mapa','informes','empleados'];
  v_fila jsonb;
begin
  if p_permisos is null or jsonb_typeof(p_permisos) <> 'object'
      or not (p_permisos ?& v_modulos)
      or exists (select 1 from jsonb_object_keys(p_permisos) as keys(key) where not (key = any(v_modulos))) then return false; end if;
  foreach v_modulo in array v_modulos loop
    v_fila := p_permisos -> v_modulo;
    if jsonb_typeof(v_fila) <> 'object'
        or not (v_fila ?& array['ver','interactuar'])
        or exists (select 1 from jsonb_object_keys(v_fila) as keys(key) where key not in ('ver','interactuar'))
        or jsonb_typeof(v_fila -> 'ver') <> 'boolean'
        or jsonb_typeof(v_fila -> 'interactuar') <> 'boolean'
        or ((v_fila ->> 'interactuar')::boolean and not (v_fila ->> 'ver')::boolean) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table public.roles (
  nombre text primary key check (length(btrim(nombre)) between 2 and 60),
  descripcion text not null default '' check (length(descripcion) <= 240),
  permisos jsonb not null check (public.permisos_rol_validos(permisos)),
  sistema boolean not null default false,
  creado_en timestamptz not null default now()
);
create unique index roles_nombre_normalizado_idx on public.roles (lower(btrim(nombre)));

insert into public.roles (nombre, descripcion, permisos, sistema) values
('ADMINISTRADOR', 'Acceso completo a todos los módulos.', jsonb_build_object(
'dashboard',jsonb_build_object('ver',true,'interactuar',true),'mesas',jsonb_build_object('ver',true,'interactuar',true),
'comandas',jsonb_build_object('ver',true,'interactuar',true),'nueva-comanda',jsonb_build_object('ver',true,'interactuar',true),
'preparacion',jsonb_build_object('ver',true,'interactuar',true),'productos',jsonb_build_object('ver',true,'interactuar',true),
'materias-primas',jsonb_build_object('ver',true,'interactuar',true),'stock',jsonb_build_object('ver',true,'interactuar',true),
'produccion',jsonb_build_object('ver',true,'interactuar',true),'recetas',jsonb_build_object('ver',true,'interactuar',true),
'mapa',jsonb_build_object('ver',true,'interactuar',true),'informes',jsonb_build_object('ver',true,'interactuar',true),
'empleados',jsonb_build_object('ver',true,'interactuar',true)), true),
('EMPLEADO', 'Permisos base de operación de salón.', jsonb_build_object(
'dashboard',jsonb_build_object('ver',true,'interactuar',false),'mesas',jsonb_build_object('ver',true,'interactuar',true),
'comandas',jsonb_build_object('ver',true,'interactuar',true),'nueva-comanda',jsonb_build_object('ver',true,'interactuar',true),
'preparacion',jsonb_build_object('ver',false,'interactuar',false),'productos',jsonb_build_object('ver',false,'interactuar',false),
'materias-primas',jsonb_build_object('ver',false,'interactuar',false),'stock',jsonb_build_object('ver',false,'interactuar',false),
'produccion',jsonb_build_object('ver',false,'interactuar',false),'recetas',jsonb_build_object('ver',false,'interactuar',false),
'mapa',jsonb_build_object('ver',false,'interactuar',false),'informes',jsonb_build_object('ver',false,'interactuar',false),
'empleados',jsonb_build_object('ver',false,'interactuar',false)), true),
('COCINA', 'Permisos base de preparación.', jsonb_build_object(
'dashboard',jsonb_build_object('ver',true,'interactuar',false),'mesas',jsonb_build_object('ver',false,'interactuar',false),
'comandas',jsonb_build_object('ver',false,'interactuar',false),'nueva-comanda',jsonb_build_object('ver',false,'interactuar',false),
'preparacion',jsonb_build_object('ver',true,'interactuar',true),'productos',jsonb_build_object('ver',false,'interactuar',false),
'materias-primas',jsonb_build_object('ver',false,'interactuar',false),'stock',jsonb_build_object('ver',false,'interactuar',false),
'produccion',jsonb_build_object('ver',false,'interactuar',false),'recetas',jsonb_build_object('ver',false,'interactuar',false),
'mapa',jsonb_build_object('ver',false,'interactuar',false),'informes',jsonb_build_object('ver',false,'interactuar',false),
'empleados',jsonb_build_object('ver',false,'interactuar',false)), true)
on conflict (nombre) do nothing;

drop function if exists public.actualizar_perfil_empleado_seguro(uuid, text, text, public.rol_empleado);
alter table public.perfiles alter column rol drop default;
alter table public.perfiles alter column rol type text using rol::text;
alter table public.perfiles alter column rol set default 'EMPLEADO';
alter table public.perfiles add constraint perfiles_rol_fkey foreign key (rol) references public.roles(nombre) on update cascade on delete restrict;

create or replace function public.tiene_permiso(p_modulo text, p_accion text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles p join public.roles r on r.nombre = p.rol
    where p.id = (select auth.uid()) and p.activo
      and (p.rol = 'ADMINISTRADOR' or
        (p_accion in ('ver','interactuar') and coalesce((r.permisos -> p_modulo ->> p_accion)::boolean, false)))
  );
$$;
create or replace function public.tiene_algun_permiso(p_modulos text[], p_accion text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from unnest(p_modulos) m where public.tiene_permiso(m, p_accion)); $$;
revoke all on function public.permisos_rol_validos(jsonb) from public, anon, authenticated;
grant execute on function public.permisos_rol_validos(jsonb) to authenticated;
revoke all on function public.tiene_permiso(text,text) from public, anon;
revoke all on function public.tiene_algun_permiso(text[],text) from public, anon;
grant execute on function public.tiene_permiso(text,text) to authenticated;
grant execute on function public.tiene_algun_permiso(text[],text) to authenticated;

revoke all on table public.roles from anon, authenticated;
grant select, insert on table public.roles to authenticated;
alter table public.roles enable row level security;
create policy roles_read_assigned_or_admin on public.roles for select to authenticated
  using (nombre = (select p.rol from public.perfiles p where p.id = (select auth.uid()))
    or public.tiene_rol(array['ADMINISTRADOR']) or public.tiene_permiso('empleados','interactuar'));
create policy roles_admin_insert_custom on public.roles for insert to authenticated
  with check (not sistema and public.tiene_rol(array['ADMINISTRADOR']));

create or replace function public.actualizar_perfil_empleado_seguro(p_empleado_id uuid,p_nombre text,p_email text,p_rol text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_actual public.perfiles%rowtype;
begin
  if not public.tiene_permiso('empleados','interactuar') then raise exception 'No tenés permiso para gestionar empleados.' using errcode='42501'; end if;
  if p_nombre is null or length(btrim(p_nombre))=0 or length(btrim(p_nombre))>120
    or p_email is null or length(btrim(p_email))>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_rol is null or not exists(select 1 from public.roles where nombre=p_rol) then
    raise exception 'Nombre, email o rol no válidos.' using errcode='22023';
  end if;
  if p_rol='ADMINISTRADOR' and not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador puede asignar el rol de administrador.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(1867319,5);
  select * into v_actual from public.perfiles where id=p_empleado_id for update;
  if not found then raise exception 'No se encontró el empleado.' using errcode='P0002'; end if;
  if p_empleado_id=auth.uid() and p_rol is distinct from v_actual.rol then
    raise exception 'No podés cambiar tu propio rol.' using errcode='42501';
  end if;
  if p_email is distinct from v_actual.email and not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador puede cambiar el email de un empleado.' using errcode='42501';
  end if;
  if p_rol is distinct from v_actual.rol and not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador puede cambiar el rol de un empleado.' using errcode='42501';
  end if;
  if v_actual.activo and v_actual.rol='ADMINISTRADOR' and p_rol<>'ADMINISTRADOR'
     and (select count(*) from public.perfiles where activo and rol='ADMINISTRADOR')<=1 then
    raise exception 'Debe quedar al menos un administrador activo.' using errcode='22023';
  end if;
  update public.perfiles set nombre=btrim(p_nombre),email=lower(btrim(p_email)),rol=p_rol where id=p_empleado_id returning * into v_actual;
  return to_jsonb(v_actual);
end;
$$;

create or replace function public.cambiar_estado_empleado_seguro(p_empleado_id uuid,p_activo boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_actual public.perfiles%rowtype;
begin
  if not public.tiene_permiso('empleados','interactuar') then raise exception 'No tenés permiso para gestionar empleados.' using errcode='42501'; end if;
  if p_activo is null then raise exception 'El estado del empleado no es válido.' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(1867319,5);
  select * into v_actual from public.perfiles where id=p_empleado_id for update;
  if not found then raise exception 'No se encontró el empleado.' using errcode='P0002'; end if;
  if p_empleado_id=auth.uid() and not p_activo then raise exception 'No podés desactivar tu propia cuenta.' using errcode='22023'; end if;
  if v_actual.rol='ADMINISTRADOR' and not public.tiene_rol(array['ADMINISTRADOR']) then
    raise exception 'Solo un administrador puede cambiar el estado de otro administrador.' using errcode='42501';
  end if;
  if not p_activo and v_actual.activo and v_actual.rol='ADMINISTRADOR'
    and (select count(*) from public.perfiles where activo and rol='ADMINISTRADOR')<=1 then
    raise exception 'Debe quedar al menos un administrador activo.' using errcode='22023';
  end if;
  update public.perfiles set activo=p_activo where id=p_empleado_id returning * into v_actual;
  return to_jsonb(v_actual);
end;
$$;
revoke all on function public.actualizar_perfil_empleado_seguro(uuid,text,text,text) from public,anon;
revoke all on function public.cambiar_estado_empleado_seguro(uuid,boolean) from public,anon;
grant execute on function public.actualizar_perfil_empleado_seguro(uuid,text,text,text) to authenticated;
grant execute on function public.cambiar_estado_empleado_seguro(uuid,boolean) to authenticated;

-- Rewrites guards in existing transactional RPCs while preserving their business logic.
do $$
declare r record; v_definicion text; v_original text; v_encontrada boolean;
begin
  for r in select * from (values
    ('crear_materia_prima','materias-primas'),('guardar_receta','recetas'),('guardar_mapa','mapa'),
    ('crear_comanda','nueva-comanda'),('editar_comanda','comandas'),('agregar_productos_comanda','comandas'),
    ('procesar_stock_comanda','preparacion'),('cambiar_estado_item_comanda','preparacion'),
    ('finalizar_comanda','comandas'),('cancelar_comanda','comandas'),
    ('registrar_movimiento_stock','stock'),('registrar_produccion','produccion'),
    ('cambiar_estado_mesa_manual','mesas')
  ) as permisos(nombre_funcion,modulo) loop
    v_encontrada := false;
    for v_definicion in select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=r.nombre_funcion
    loop
      v_encontrada := true;
      v_original := v_definicion;
      v_definicion := regexp_replace(v_definicion,'(?i)public\.tiene_rol\(ARRAY\[[^)]*\]\)',
        format('public.tiene_permiso(%L, %L)',r.modulo,'interactuar'),'g');
      if v_definicion = v_original then
        raise exception 'No se pudo actualizar la protección de la función %', r.nombre_funcion;
      end if;
      execute v_definicion;
    end loop;
    if not v_encontrada then raise exception 'No existe la función de operación %', r.nombre_funcion; end if;
  end loop;
end;
$$;

create or replace function public.informe_ventas(p_desde timestamptz,p_hasta_exclusiva timestamptz)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_resultado jsonb;
begin
  if not public.tiene_permiso('informes','ver') then raise exception 'No tenés permiso para ver informes.' using errcode='42501'; end if;
  with ordenes as (
    select c.id,c.estado,c.fecha_creacion from public.comandas c where c.fecha_creacion>=p_desde and c.fecha_creacion<p_hasta_exclusiva
  ), items_finalizados as (
    select ci.producto_id,ci.nombre_producto,ci.cantidad,ci.precio_unitario,o.fecha_creacion
    from ordenes o join public.comanda_items ci on ci.comanda_id=o.id where o.estado='finalizada'
  ), ranking as (
    select producto_id as "productoId",min(nombre_producto) as nombre,sum(cantidad) as cantidad,sum(cantidad*precio_unitario) as ventas
    from items_finalizados group by producto_id order by sum(cantidad) desc,min(nombre_producto) limit 10
  ), dias as (
    select (fecha_creacion at time zone 'UTC')::date as fecha,sum(cantidad*precio_unitario) as ventas
    from items_finalizados group by (fecha_creacion at time zone 'UTC')::date
  )
  select jsonb_build_object(
    'totalComandas',(select count(*) from ordenes),
    'comandasFinalizadas',(select count(*) from ordenes where estado='finalizada'),
    'productosVendidos',coalesce((select sum(cantidad) from items_finalizados),0),
    'ventasEstimadas',round(coalesce((select sum(cantidad*precio_unitario) from items_finalizados),0),2),
    'productosMasVendidos',coalesce((select jsonb_agg(to_jsonb(ranking)) from ranking),'[]'::jsonb),
    'ventasPorDia',coalesce((select jsonb_agg(jsonb_build_object('fecha',fecha,
      'comandas',(select count(*) from ordenes where (fecha_creacion at time zone 'UTC')::date=dias.fecha and estado='finalizada'),
      'ventas',round(ventas,2)) order by fecha) from dias),'[]'::jsonb)
  ) into v_resultado;
  return v_resultado;
end;
$$;
revoke all on function public.informe_ventas(timestamptz,timestamptz) from public,anon;
grant execute on function public.informe_ventas(timestamptz,timestamptz) to authenticated;

-- Replace role-specific RLS predicates with module permissions. Reads include only
-- related catalogs needed to render the module using the same authenticated session.
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles for select to authenticated
  using (id=(select auth.uid()) or public.tiene_permiso('empleados','ver'));

drop policy if exists mesas_read on public.mesas;
drop policy if exists mesas_admin_write on public.mesas;
create policy mesas_read on public.mesas for select to authenticated
  using (public.tiene_algun_permiso(array['mesas','comandas','nueva-comanda','mapa','dashboard'],'ver'));
create policy mesas_manage on public.mesas for all to authenticated
  using (public.tiene_permiso('mesas','interactuar')) with check (public.tiene_permiso('mesas','interactuar'));

drop policy if exists productos_read on public.productos;
drop policy if exists productos_admin_write on public.productos;
create policy productos_read on public.productos for select to authenticated
  using (public.tiene_algun_permiso(array['productos','comandas','nueva-comanda','preparacion','stock','produccion','recetas','dashboard'],'ver'));
create policy productos_manage on public.productos for all to authenticated
  using (public.tiene_permiso('productos','interactuar')) with check (public.tiene_permiso('productos','interactuar'));

drop policy if exists materias_primas_read on public.materias_primas;
drop policy if exists materias_primas_admin_write on public.materias_primas;
create policy materias_primas_read on public.materias_primas for select to authenticated
  using (public.tiene_algun_permiso(array['materias-primas','stock','produccion','recetas','dashboard'],'ver'));
create policy materias_primas_manage on public.materias_primas for all to authenticated
  using (public.tiene_permiso('materias-primas','interactuar')) with check (public.tiene_permiso('materias-primas','interactuar'));

drop policy if exists recetas_read on public.recetas;
drop policy if exists recetas_admin_write on public.recetas;
create policy recetas_read on public.recetas for select to authenticated
  using (public.tiene_algun_permiso(array['recetas','produccion'],'ver'));
create policy recetas_manage on public.recetas for all to authenticated
  using (public.tiene_permiso('recetas','interactuar')) with check (public.tiene_permiso('recetas','interactuar'));

drop policy if exists receta_ingredientes_read on public.receta_ingredientes;
drop policy if exists receta_ingredientes_admin_write on public.receta_ingredientes;
create policy receta_ingredientes_read on public.receta_ingredientes for select to authenticated
  using (public.tiene_algun_permiso(array['recetas','produccion'],'ver'));
create policy receta_ingredientes_manage on public.receta_ingredientes for all to authenticated
  using (public.tiene_permiso('recetas','interactuar')) with check (public.tiene_permiso('recetas','interactuar'));

drop policy if exists elementos_mapa_read on public.elementos_mapa;
drop policy if exists elementos_mapa_admin_write on public.elementos_mapa;
create policy elementos_mapa_read on public.elementos_mapa for select to authenticated
  using (public.tiene_algun_permiso(array['mapa','mesas'],'ver'));
create policy elementos_mapa_manage on public.elementos_mapa for all to authenticated
  using (public.tiene_permiso('mapa','interactuar')) with check (public.tiene_permiso('mapa','interactuar'));

drop policy if exists comandas_read on public.comandas;
drop policy if exists comandas_operador_insert on public.comandas;
drop policy if exists comandas_operador_update on public.comandas;
drop policy if exists comandas_admin_delete on public.comandas;
create policy comandas_read on public.comandas for select to authenticated
  using (public.tiene_algun_permiso(array['comandas','nueva-comanda','preparacion','dashboard'],'ver'));
create policy comandas_create on public.comandas for insert to authenticated
  with check (public.tiene_permiso('nueva-comanda','interactuar'));
create policy comandas_update on public.comandas for update to authenticated
  using (public.tiene_permiso('comandas','interactuar') or public.tiene_permiso('nueva-comanda','interactuar'))
  with check (public.tiene_permiso('comandas','interactuar') or public.tiene_permiso('nueva-comanda','interactuar'));
create policy comandas_delete on public.comandas for delete to authenticated
  using (public.tiene_permiso('comandas','interactuar'));

drop policy if exists comanda_items_read on public.comanda_items;
drop policy if exists comanda_items_operador_insert on public.comanda_items;
drop policy if exists comanda_items_operador_update on public.comanda_items;
drop policy if exists comanda_items_cocina_update on public.comanda_items;
drop policy if exists comanda_items_admin_delete on public.comanda_items;
create policy comanda_items_read on public.comanda_items for select to authenticated
  using (public.tiene_algun_permiso(array['comandas','nueva-comanda','preparacion','dashboard'],'ver'));
create policy comanda_items_create on public.comanda_items for insert to authenticated
  with check (public.tiene_permiso('nueva-comanda','interactuar'));
create policy comanda_items_update on public.comanda_items for update to authenticated
  using (public.tiene_algun_permiso(array['comandas','nueva-comanda','preparacion'],'interactuar'))
  with check (public.tiene_algun_permiso(array['comandas','nueva-comanda','preparacion'],'interactuar'));
create policy comanda_items_delete on public.comanda_items for delete to authenticated
  using (public.tiene_permiso('comandas','interactuar'));

drop policy if exists producciones_read on public.producciones;
drop policy if exists producciones_operador_insert on public.producciones;
drop policy if exists producciones_admin_update on public.producciones;
drop policy if exists producciones_admin_delete on public.producciones;
create policy producciones_read on public.producciones for select to authenticated
  using (public.tiene_permiso('produccion','ver'));
create policy producciones_create on public.producciones for insert to authenticated
  with check (public.tiene_permiso('produccion','interactuar'));
create policy producciones_update on public.producciones for update to authenticated
  using (public.tiene_permiso('produccion','interactuar')) with check (public.tiene_permiso('produccion','interactuar'));
create policy producciones_delete on public.producciones for delete to authenticated
  using (public.tiene_permiso('produccion','interactuar'));

drop policy if exists operaciones_stock_read on public.operaciones_stock;
drop policy if exists movimientos_stock_read on public.movimientos_stock;
create policy operaciones_stock_read on public.operaciones_stock for select to authenticated
  using (public.tiene_algun_permiso(array['stock','produccion','preparacion','dashboard'],'ver'));
create policy movimientos_stock_read on public.movimientos_stock for select to authenticated
  using (public.tiene_algun_permiso(array['stock','produccion','preparacion','dashboard'],'ver'));

drop policy if exists auditoria_eventos_admin_read on public.auditoria_eventos;
create policy auditoria_eventos_admin_read on public.auditoria_eventos for select to authenticated
  using (public.tiene_permiso('informes','ver'));

commit;

