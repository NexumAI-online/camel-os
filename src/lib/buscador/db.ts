import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { PORTALES, type FiltrosBuscador, type Resultado } from './types';

/** Lista resultados no descartados, aplicando los filtros del tablero. */
export async function listarResultados(filtros: FiltrosBuscador = {}): Promise<Resultado[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('busqueda_resultados')
    .select('*')
    .eq('descartado', false)
    .order('encontrado_en', { ascending: false });

  const texto = filtros.q?.trim();
  if (texto) {
    const seguro = texto.replace(/[(),]/g, ' ').trim();
    if (seguro) {
      q = q.or(`marca.ilike.%${seguro}%,modelo.ilike.%${seguro}%,titulo.ilike.%${seguro}%`);
    }
  }
  if (filtros.portal && PORTALES.some((p) => p.value === filtros.portal)) {
    q = q.eq('portal', filtros.portal);
  }
  if (typeof filtros.precioMax === 'number' && Number.isFinite(filtros.precioMax)) {
    q = q.lte('precio', filtros.precioMax);
  }
  if (typeof filtros.anioMin === 'number' && Number.isFinite(filtros.anioMin)) {
    q = q.gte('anio', filtros.anioMin);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Resultado[];
}

/** Cuenta total de resultados activos (para el encabezado). */
export async function contarResultados(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('busqueda_resultados')
    .select('id', { count: 'exact', head: true })
    .eq('descartado', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
