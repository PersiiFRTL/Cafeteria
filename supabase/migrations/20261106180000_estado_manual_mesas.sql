-- Permite marcar una mesa ocupada para unirla físicamente a otra mesa,
-- aunque todavía no tenga una comanda propia.
create or replace function public.cambiar_estado_mesa_manual(
  p_mesa_id bigint,
  p_estado text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_estado_actual text;
begin
  if not public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO']) then
    raise exception 'No tenés permisos para cambiar el estado de las mesas.' using errcode = '42501';
  end if;
  if p_mesa_id is null or p_estado is null or p_estado not in ('libre', 'ocupada') then
    raise exception 'El ID o el estado de la mesa no son válidos.' using errcode = '22023';
  end if;

  select estado into v_estado_actual
  from public.mesas
  where id = p_mesa_id
  for update;
  if not found then
    raise exception 'No se encontró la mesa.' using errcode = 'P0002';
  end if;

  -- Las comandas controlan su propia ocupación y liberación transaccional.
  if exists (
    select 1 from public.comandas
    where mesa_id = p_mesa_id and estado in ('pendiente', 'preparando', 'lista')
  ) then
    raise exception 'No se puede cambiar manualmente una mesa con una comanda activa.' using errcode = '22023';
  end if;

  update public.mesas set estado = p_estado where id = p_mesa_id;
end;
$$;

revoke all on function public.cambiar_estado_mesa_manual(bigint, text) from public, anon;
grant execute on function public.cambiar_estado_mesa_manual(bigint, text) to authenticated;
