-- @file Permisos mínimos para `authenticated`.
--
-- Supabase concede por defecto a `authenticated` todos los permisos sobre las tablas
-- de `public` (también TRUNCATE, que no pasa por RLS). La migración anterior solo
-- añadía permisos sin quitar esos. Aquí se quita todo y se da solo lo que la web usa:
-- RLS decide qué filas, y estos permisos, qué operaciones.

do $$
declare
  t text;
begin
  foreach t in array array['perfiles', 'dias_completados', 'logros_obtenidos', 'victorias_jefe', 'estado_canciones']
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end;
$$;

-- El perfil lo crea el trigger y se borra con la cuenta: aquí solo leer y editar.
grant select, update on public.perfiles to authenticated;

grant select, insert, update, delete on
  public.dias_completados,
  public.logros_obtenidos,
  public.victorias_jefe,
  public.estado_canciones
to authenticated;
