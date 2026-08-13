import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Portal, ResultadoScrapeado, ResumenIngesta } from './types';
import { filtrar, type FiltrosScrape } from './filtrar';

/** Tamaño de lote: un `.in()` con cientos de URLs arma una query enorme (414). */
const LOTE = 80;

function enLotes<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Persiste los resultados de un scraper en `busqueda_resultados`, evitando
 * duplicados por URL. Hacemos SELECT + diff en vez de un upsert onConflict
 * porque el único de la tabla es un índice PARCIAL (where url is not null),
 * que PostgREST no toma como target de conflicto de forma fiable.
 *
 * TODO se hace EN LOTES: con ~300 resultados, un solo `.in('url', [...])` o un
 * insert gigante rompen (URI too long / payload). Por eso troceamos.
 */
export async function ingestarResultados(
  portal: Portal,
  filas: ResultadoScrapeado[],
  filtros: FiltrosScrape = {},
): Promise<ResumenIngesta> {
  const supabase = getSupabaseAdmin();

  // Filtra ANTES de guardar: solo entran al tablero las que cumplen lo pedido.
  const relevantes = filtrar(filas, filtros);

  // Solo consideramos filas con URL (es la clave anti-duplicado) y deduplicamos
  // dentro del propio lote (el scraper puede repetir una URL entre páginas).
  const porUrl = new Map<string, ResultadoScrapeado>();
  for (const f of relevantes) if (f.url) porUrl.set(f.url, f);
  const conUrl = [...porUrl.values()];
  const urls = [...porUrl.keys()];

  // 1) URLs ya presentes (en lotes).
  const existentes = new Set<string>();
  for (const lote of enLotes(urls, LOTE)) {
    const { data, error } = await supabase
      .from('busqueda_resultados')
      .select('url')
      .in('url', lote);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) if (row.url) existentes.add(row.url as string);
  }

  // 2) Insertar los nuevos (en lotes).
  const nuevos = conUrl
    .filter((f) => !existentes.has(f.url as string))
    .map((f) => ({ ...f, portal }));

  for (const lote of enLotes(nuevos, LOTE)) {
    let { error } = await supabase.from('busqueda_resultados').insert(lote);
    // La columna `color` es opcional: si el ALTER aún no se corrió, reintentamos
    // sin ella (el color no persiste hasta crear la columna, nada más se rompe).
    if (error && /color/i.test(error.message)) {
      const sinColor = lote.map((row) => {
        const copia: Record<string, unknown> = { ...row };
        delete copia.color;
        return copia;
      });
      ({ error } = await supabase.from('busqueda_resultados').insert(sinColor));
    }
    if (error) throw new Error(error.message);
  }

  return {
    encontrados: relevantes.length,
    insertados: nuevos.length,
    duplicados: conUrl.length - nuevos.length,
  };
}
