-- @file Primera migración: perfiles y progreso por usuario, con RLS.
--
-- Diseño: docs/diseno-tecnico.md (sección 7). Configuración del proyecto: docs/supabase.md.
-- Los ids de contenido (dia_id, logro_id, jefe_id, cancion_id) son los de src/data:
-- no hay clave foránea hacia ellos porque el contenido vive en JSON, no en Postgres.
--
-- Reglas que siguen todas las tablas:
--   * RLS activada de forma explícita (aunque el panel ya la active sola).
--   * Cada persona solo ve y toca sus filas: (select auth.uid()) = user_id.
--     El `select` alrededor hace que Postgres calcule auth.uid() una vez por
--     consulta y no una vez por fila (recomendación de Supabase).
--   * Solo el rol `authenticated` (sesión iniciada) tiene permisos; `anon`, ninguno.
--   * Borrar la cuenta borra su progreso (on delete cascade).

-- ---------------------------------------------------------------------------
-- Utilidad: mantener `actualizado_en` al día en cada UPDATE.
-- ---------------------------------------------------------------------------
create function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- perfiles: un registro por cuenta, con las fechas que mueven el calendario.
-- ---------------------------------------------------------------------------
create table public.perfiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nombre                text check (char_length(nombre) between 1 and 80),
  -- Día 1 del plan. Por usuario, para que el calendario sirva a cualquiera.
  fecha_inicio          date not null default current_date,
  -- Vacía hasta que llegue la flauta; marca el paso a las semanas «con flauta».
  fecha_llegada_flauta  date check (fecha_llegada_flauta >= fecha_inicio),
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "perfiles: ver el propio" on public.perfiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfiles: editar el propio" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- Sin política de insert ni de delete: el perfil lo crea el trigger de abajo
-- y desaparece al borrar la cuenta.

create trigger perfiles_actualizado_en before update on public.perfiles
  for each row execute function public.tocar_actualizado_en();

-- Crea el perfil automáticamente al registrarse alguien.
-- `security definer` porque quien se registra aún no tiene permiso de insertar;
-- `search_path = ''` evita que alguien suplante tablas o funciones por el nombre.
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id) values (new.id);
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

-- Nadie debe poder llamarla a mano (solo el trigger).
revoke execute on function public.crear_perfil() from public, anon, authenticated;

-- Cuentas creadas antes de esta migración (el trigger solo ve las nuevas).
insert into public.perfiles (id) select id from auth.users on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- dias_completados: sesiones del plan marcadas como hechas.
-- ---------------------------------------------------------------------------
create table public.dias_completados (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia_id         text not null check (dia_id ~ '^dia-[0-9]{2,3}$'),
  completado_en  timestamptz not null default now(),
  minutos        smallint check (minutos between 1 and 300),
  notas          text check (char_length(notas) <= 2000),
  -- Clave compuesta: un día se completa una sola vez por persona (y permite upsert).
  primary key (user_id, dia_id)
);

-- ---------------------------------------------------------------------------
-- logros_obtenidos
-- ---------------------------------------------------------------------------
create table public.logros_obtenidos (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logro_id       text not null check (logro_id ~ '^logro-[a-z0-9-]+$'),
  obtenido_en    timestamptz not null default now(),
  evidencia_url  text check (evidencia_url ~ '^https://'),
  primary key (user_id, logro_id)
);

-- ---------------------------------------------------------------------------
-- victorias_jefe: grabar es parte de la victoria, así que el video es obligatorio.
-- ---------------------------------------------------------------------------
create table public.victorias_jefe (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  jefe_id        text not null check (jefe_id ~ '^jefe-[a-z0-9-]+$'),
  video_url      text not null check (video_url ~ '^https://'),
  tempo_logrado  smallint check (tempo_logrado between 20 and 300),
  vencido_en     timestamptz not null default now(),
  primary key (user_id, jefe_id)
);

-- ---------------------------------------------------------------------------
-- estado_canciones: dónde va cada canción del catálogo.
-- ---------------------------------------------------------------------------
create table public.estado_canciones (
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cancion_id      text not null check (cancion_id ~ '^[a-z0-9-]+$'),
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'aprendiendo', 'dominada')),
  actualizado_en  timestamptz not null default now(),
  primary key (user_id, cancion_id)
);

create trigger estado_canciones_actualizado_en before update on public.estado_canciones
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- RLS y permisos de las cuatro tablas de progreso (mismas reglas en todas).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['dias_completados', 'logros_obtenidos', 'victorias_jefe', 'estado_canciones']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: ver lo propio" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: crear lo propio" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: editar lo propio" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t, t);
    execute format('create policy "%s: borrar lo propio" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

revoke all on public.perfiles from anon;
grant select, update on public.perfiles to authenticated;
