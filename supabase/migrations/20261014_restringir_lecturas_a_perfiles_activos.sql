-- Aplicar después de la migración inicial en el SQL Editor de Supabase.
-- Restringe lecturas a usuarios autenticados con un perfil activo y rol válido.
begin;

drop policy if exists mesas_read on public.mesas;
create policy mesas_read on public.mesas for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists productos_read on public.productos;
create policy productos_read on public.productos for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists materias_primas_read on public.materias_primas;
create policy materias_primas_read on public.materias_primas for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists recetas_read on public.recetas;
create policy recetas_read on public.recetas for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists receta_ingredientes_read on public.receta_ingredientes;
create policy receta_ingredientes_read on public.receta_ingredientes for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists elementos_mapa_read on public.elementos_mapa;
create policy elementos_mapa_read on public.elementos_mapa for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists comandas_read on public.comandas;
create policy comandas_read on public.comandas for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists comanda_items_read on public.comanda_items;
create policy comanda_items_read on public.comanda_items for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

-- Cocina solo puede operar ítems de comandas que aún estén activas, incluso al modificarlos.
drop policy if exists comanda_items_cocina_update on public.comanda_items;
create policy comanda_items_cocina_update on public.comanda_items for update to authenticated
  using (
    public.tiene_rol(array['COCINA'])
    and exists (
      select 1 from public.comandas c
      where c.id = comanda_id and c.estado in ('pendiente', 'preparando')
    )
  )
  with check (
    public.tiene_rol(array['COCINA'])
    and exists (
      select 1 from public.comandas c
      where c.id = comanda_id and c.estado in ('pendiente', 'preparando')
    )
  );

drop policy if exists producciones_read on public.producciones;
create policy producciones_read on public.producciones for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists operaciones_stock_read on public.operaciones_stock;
create policy operaciones_stock_read on public.operaciones_stock for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

drop policy if exists movimientos_stock_read on public.movimientos_stock;
create policy movimientos_stock_read on public.movimientos_stock for select to authenticated
  using (public.tiene_rol(array['ADMINISTRADOR', 'EMPLEADO', 'COCINA']));

commit;
