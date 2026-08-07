import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { PORTALES, type FiltrosBuscador, type Resultado } from './types';

function esNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

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

  // Portales (multi-check): sólo valores válidos.
  const portales = (filtros.portales ?? []).filter((p) => PORTALES.some((x) => x.value === p));
  if (portales.length) q = q.in('portal', portales);

  // Specs (multi-check).
  if (filtros.specs && filtros.specs.length) q = q.in('specs', filtros.specs);

  // Rango de año.
  if (esNum(filtros.anioMin)) q = q.gte('anio', filtros.anioMin);
  if (esNum(filtros.anioMax)) q = q.lte('anio', filtros.anioMax);

  // Rango de precio (ya convertido a AED en la página).
  if (esNum(filtros.precioMinAed)) q = q.gte('precio', filtros.precioMinAed);
  if (esNum(filtros.precioMaxAed)) q = q.lte('precio', filtros.precioMaxAed);

  // Rango de km.
  if (esNum(filtros.kmMin)) q = q.gte('km', filtros.kmMin);
  if (esNum(filtros.kmMax)) q = q.lte('km', filtros.kmMax);

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
