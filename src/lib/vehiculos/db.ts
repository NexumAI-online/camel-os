import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Foto, Vehiculo } from './types';

/** Garantiza que `fotos` sea siempre un array (columna puede venir null). */
function normalizar(row: Record<string, unknown>): Vehiculo {
  return {
    ...(row as unknown as Vehiculo),
    fotos: Array.isArray(row.fotos) ? (row.fotos as Foto[]) : [],
  };
}

/** Lista vehículos, opcionalmente filtrados por texto (marca/modelo/bastidor). */
export async function listarVehiculos(busqueda?: string): Promise<Vehiculo[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from('vehiculos').select('*').order('creada_en', { ascending: false });

  const b = busqueda?.trim();
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

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => normalizar(r as Record<string, unknown>));
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
