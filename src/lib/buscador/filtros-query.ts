import { aAed } from './constants';
import type { FiltrosScrape } from './filtrar';

/** Entero desde un parámetro de query (ignora separadores no numéricos). */
function num(sp: URLSearchParams, k: string): number | undefined {
  const v = sp.get(k);
  if (!v) return undefined;
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Reconstruye los filtros de scraping desde la query. Lo usan las rutas de API
 * (Dubicars y estado de Apify), que reciben los filtros vigentes del tablero
 * para aplicarlos ANTES de guardar. El precio llega en la moneda elegida y se
 * convierte a AED (que es como se guarda).
 */
export function filtrosDeQuery(sp: URLSearchParams): FiltrosScrape {
  const moneda = sp.get('moneda') || 'AED';
  const precioMin = num(sp, 'precioMin');
  const precioMax = num(sp, 'precioMax');
  return {
    specs: sp.getAll('specs').filter(Boolean),
    anioMin: num(sp, 'anioMin'),
    anioMax: num(sp, 'anioMax'),
    kmMin: num(sp, 'kmMin'),
    kmMax: num(sp, 'kmMax'),
    precioMinAed: precioMin != null ? Math.round(aAed(precioMin, moneda)) : undefined,
    precioMaxAed: precioMax != null ? Math.round(aAed(precioMax, moneda)) : undefined,
  };
}
