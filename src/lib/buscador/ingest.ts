import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Portal, ResultadoScrapeado, ResumenIngesta } from './types';

/**
 * Persiste los resultados de un scraper en `busqueda_resultados`, evitando
 * duplicados por URL. Hacemos SELECT + diff en vez de un upsert onConflict
 * porque el único de la tabla es un índice PARCIAL (where url is not null),
 * que PostgREST no toma como target de conflicto de forma fiable.
 */
export async function ingestarResultados(
  portal: Portal,
  filas: ResultadoScrapeado[],
): Promise<ResumenIngesta> {
  const supabase = getSupabaseAdmin();

  // Solo consideramos filas con URL (es la clave anti-duplicado).
  const conUrl = filas.filter((f) => !!f.url);
  const urls = conUrl.map((f) => f.url as string);

  const existentes = new Set<string>();
  if (urls.length) {
    const { data, error } = await supabase
      .from('busqueda_resultados')
      .select('url')
      .in('url', urls);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) if (row.url) existentes.add(row.url as string);
  }

  const nuevos = conUrl
    .filter((f) => !existentes.has(f.url as string))
    .map((f) => ({ ...f, portal }));

  if (nuevos.length) {
    const { error } = await supabase.from('busqueda_resultados').insert(nuevos);
    if (error) throw new Error(error.message);
  }

  return {
    encontrados: filas.length,
    insertados: nuevos.length,
    duplicados: conUrl.length - nuevos.length,
  };
}
