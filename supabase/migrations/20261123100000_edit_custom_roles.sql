-- Allow administrators to update custom roles and the built-in Empleado/Cocina
-- roles. Administrador remains immutable; built-in role names cannot be changed.
grant update on table public.roles to authenticated;

drop policy if exists roles_admin_update_custom on public.roles;
drop policy if exists roles_admin_update_authorized on public.roles;

create policy roles_admin_update_authorized on public.roles
  for update to authenticated
  using (
    public.tiene_rol(array['ADMINISTRADOR'])
    and (not sistema or nombre in ('EMPLEADO', 'COCINA'))
  )
  with check (
    public.tiene_rol(array['ADMINISTRADOR'])
    and (not sistema or nombre in ('EMPLEADO', 'COCINA'))
  );
