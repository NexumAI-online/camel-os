-- ─────────────────────────────────────────────────────────────
-- Camel OS · Feature 4 (Clientes) · esquema Supabase
-- Ejecutar en el SQL Editor del proyecto Supabase de Camel.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.clientes (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null default 'business'
                   check (tipo in ('business', 'particular')),
  nombre         text not null,
  cif            text,                    -- CIF / NIF / Tax ID
  direccion      text,
  email          text,
  telefono       text,
  notas          text,
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists clientes_nombre_idx     on public.clientes (nombre);
create index if not exists clientes_creada_en_idx   on public.clientes (creada_en desc);

-- Mantener actualizada_en al día (misma función que vehículos/facturas).
create or replace function public.set_actualizada_en()
returns trigger language plpgsql as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

drop trigger if exists clientes_set_actualizada_en on public.clientes;
create trigger clientes_set_actualizada_en
  before update on public.clientes
  for each row execute function public.set_actualizada_en();

alter table public.clientes enable row level security;

-- ── Asociar vehículos a un cliente ──
-- ON DELETE SET NULL: borrar un cliente NO borra sus vehículos (quedan sin cliente).
alter table public.vehiculos
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
create index if not exists vehiculos_cliente_idx on public.vehiculos (cliente_id);
