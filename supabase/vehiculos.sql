-- ─────────────────────────────────────────────────────────────
-- Camel OS · Feature 2 (Base de Datos de vehículos) · esquema Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase de Camel.
-- v1: datos + CRUD + búsqueda. Fotos/docs se agregan en un segundo paso.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.vehiculos (
  id             uuid primary key default gen_random_uuid(),
  marca          text not null,
  modelo         text not null,
  anio           integer,
  km             integer,
  bastidor       text,                       -- VIN / número de chasis
  mulquilla      text,                       -- referencia del doc de propiedad (UAE)
  color          text,
  precio_compra  numeric,                    -- en AED
  estado         text not null default 'en_dubai'
                   check (estado in ('en_dubai', 'en_transito', 'en_espana', 'vendido')),
  notas          text,
  fotos          jsonb not null default '[]'::jsonb,   -- [{path,url}] en Supabase Storage
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists vehiculos_creada_en_idx on public.vehiculos (creada_en desc);
create index if not exists vehiculos_estado_idx    on public.vehiculos (estado);
create index if not exists vehiculos_bastidor_idx  on public.vehiculos (bastidor);

-- Mantener actualizada_en al día en cada UPDATE.
create or replace function public.set_actualizada_en()
returns trigger language plpgsql as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

drop trigger if exists vehiculos_set_actualizada_en on public.vehiculos;
create trigger vehiculos_set_actualizada_en
  before update on public.vehiculos
  for each row execute function public.set_actualizada_en();

-- El backend escribe con la service role key (bypassa RLS). Activamos RLS para
-- que ningún cliente anónimo acceda directo.
alter table public.vehiculos enable row level security;

-- ── Migración para tablas ya creadas (fotos de vehículos) ──
-- Si la tabla `vehiculos` ya existía, correr esto para habilitar las fotos.
alter table public.vehiculos add column if not exists fotos jsonb not null default '[]'::jsonb;
