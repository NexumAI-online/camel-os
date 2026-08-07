import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Documento, FiltrosVehiculos, Foto, Vehiculo } from './types';

/** Garantiza que `fotos`/`documentos` sean arrays y `mulquilla` booleano. */
function normalizar(row: Record<string, unknown>): Vehiculo {
  return {
    ...(row as unknown as Vehiculo),
    fotos: Array.isArray(row.fotos) ? (row.fotos as Foto[]) : [],
    documentos: Array.isArray(row.documentos) ? (row.documentos as Documento[]) : [],
    mulquilla: row.mulquilla === true,
  };
}

/** Traduce el valor de orden del tablero a (columna, ascendente). */
function ordenSql(orden?: string): { col: string; asc: boolean } {
  switch (orden) {
    case 'precio_desc': return { col: 'precio_compra', asc: false };
    case 'precio_asc': return { col: 'precio_compra', asc: true };
    case 'anio_desc': return { col: 'anio', asc: false };
    case 'anio_asc': return { col: 'anio', asc: true };
    case 'km_asc': return { col: 'km', asc: true };
    case 'km_desc': return { col: 'km', asc: false };
    case 'marca': return { col: 'marca', asc: true };
    case 'mulkiya': return { col: 'mulquilla', asc: false }; // con mulkiya primero
    default: return { col: 'creada_en', asc: false };
  }
}

/** Lista vehículos aplicando filtros (texto/marca/estado/mulkiya) y orden. */
export async function listarVehiculos(filtros: FiltrosVehiculos = {}): Promise<Vehiculo[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from('vehiculos').select('*');

  const b = filtros.q?.trim();
  if (b) {
    // Sanea el término: los caracteres de control del filtro `or` de PostgREST
    // (coma y paréntesis) se quitan para evitar romper la query.
    const seguro = b.replace(/[(),]/g, ' ').trim();
    if (seguro) {
      q = q.or(
        `marca.ilike.%${seguro}%,modelo.ilike.%${seguro}%,bastidor.ilike.%${seguro}%`,
      );
    }
  }
  if (filtros.marca) q = q.eq('marca', filtros.marca);
  if (filtros.estado) q = q.eq('estado', filtros.estado);
  if (filtros.mulkiya === 'si') q = q.eq('mulquilla', true);
  if (filtros.mulkiya === 'no') q = q.eq('mulquilla', false);

  const { col, asc } = ordenSql(filtros.orden);
  q = q.order(col, { ascending: asc, nullsFirst: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => normalizar(r as Record<string, unknown>));
}

/** Marcas distintas presentes en la base (para el filtro por marca). */
export async function listarMarcas(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('vehiculos').select('marca');
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((r) => r.marca as string).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'es'),
  );
}

/** Obtiene un vehículo por id, o null si no existe. */
export async function obtenerVehiculo(id: string): Promise<Vehiculo | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizar(data as Record<string, unknown>) : null;
}
