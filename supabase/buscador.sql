-- ─────────────────────────────────────────────────────────────
-- Camel OS · Feature 3 (Buscador de unidades en Dubái) · esquema Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase de Camel.
-- v1: tablero + modelo de datos. Los scrapers (motor a definir) empujan acá.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.busqueda_resultados (
  id             uuid primary key default gen_random_uuid(),
  portal         text not null
                   check (portal in ('dubizzle', 'yallamotor', 'dubicars', 'fb_marketplace')),
  titulo         text,
  marca          text,
  modelo         text,
  anio           integer,
  km             integer,
  precio         numeric,
  moneda         text not null default 'AED',
  ubicacion      text,
  url            text,          -- link al anuncio original
  imagen_url     text,          -- foto principal del anuncio
  vendedor       text,
  descartado     boolean not null default false,   -- Carlos lo descartó
  encontrado_en  timestamptz not null default now()
);

create index if not exists resultados_portal_idx     on public.busqueda_resultados (portal);
create index if not exists resultados_marca_idx       on public.busqueda_resultados (marca);
create index if not exists resultados_precio_idx      on public.busqueda_resultados (precio);
create index if not exists resultados_encontrado_idx  on public.busqueda_resultados (encontrado_en desc);

-- Evita duplicados del mismo anuncio (misma URL) si un scraper corre varias veces.
create unique index if not exists resultados_url_uniq on public.busqueda_resultados (url) where url is not null;

alter table public.busqueda_resultados enable row level security;

-- ── Migración 2026-08-07 · specs (origen/homologación) ──
-- Valor canónico: gcc | american | canadian | european | japanese | korean | chinese | other
alter table public.busqueda_resultados add column if not exists specs text;
create index if not exists resultados_specs_idx on public.busqueda_resultados (specs);
create index if not exists resultados_anio_idx  on public.busqueda_resultados (anio);
create index if not exists resultados_km_idx    on public.busqueda_resultados (km);
