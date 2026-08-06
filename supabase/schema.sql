-- ─────────────────────────────────────────────────────────────
-- Camel OS · Feature 1 (Facturación) · esquema Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase de Camel.
-- Índice de facturas generadas. El PDF vive en Google Drive; acá guardamos
-- los datos consultables + el link al PDF.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.facturas (
  id                      uuid primary key default gen_random_uuid(),
  numero                  text not null,
  tipo                    text not null check (tipo in ('venta', 'gasto')),
  idioma                  text not null check (idioma in ('es', 'en')),
  moneda                  text not null,
  fecha                   text,                       -- dd/mm/aaaa (como lo escribe el usuario)
  cliente_nombre          text,
  cliente_identificacion  text,
  cliente_direccion       text,
  total                   numeric not null default 0,
  lineas                  jsonb   not null default '[]'::jsonb,
  drive_url               text,                       -- link al PDF en Drive (null si Drive no estaba activo)
  creada_en               timestamptz not null default now()
);

create index if not exists facturas_numero_idx    on public.facturas (numero);
create index if not exists facturas_creada_en_idx on public.facturas (creada_en desc);

-- El servidor escribe con la service role key (bypassa RLS). Activamos RLS para
-- que ningún cliente anónimo pueda leer/escribir directamente.
alter table public.facturas enable row level security;
-- (Sin políticas: solo la service role del backend accede. Añadir políticas
--  cuando haya lectura desde el frontend con usuarios autenticados.)

-- ── Migración para tablas ya creadas (edición de facturas) ──
-- Si la tabla `facturas` ya existía, correr esto para persistir la dirección
-- del cliente al editar una factura. Es idempotente y seguro.
alter table public.facturas add column if not exists cliente_direccion text;
