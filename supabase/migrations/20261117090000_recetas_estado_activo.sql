-- Permite deshabilitar una receta sin borrar su configuración de ingredientes.
alter table public.recetas
  add column if not exists activo boolean not null default true;
