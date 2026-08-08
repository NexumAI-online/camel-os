import type { ResultadoScrapeado } from './types';

/** Filtros aplicados ANTES de guardar (precio ya convertido a AED). */
export interface FiltrosScrape {
  specs?: string[];
  anioMin?: number;
  anioMax?: number;
  precioMinAed?: number;
  precioMaxAed?: number;
  kmMin?: number;
  kmMax?: number;
}

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export function hayFiltros(f: FiltrosScrape): boolean {
  return !!(
    f.specs?.length ||
    n(f.anioMin) != null ||
    n(f.anioMax) != null ||
    n(f.precioMinAed) != null ||
    n(f.precioMaxAed) != null ||
    n(f.kmMin) != null ||
    n(f.kmMax) != null
  );
}

/** ¿La unidad cumple todos los filtros seleccionados? */
export function coincide(r: ResultadoScrapeado, f: FiltrosScrape): boolean {
  if (f.specs?.length && (!r.specs || !f.specs.includes(r.specs))) return false;
  if (n(f.anioMin) != null && (r.anio == null || r.anio < f.anioMin!)) return false;
  if (n(f.anioMax) != null && (r.anio == null || r.anio > f.anioMax!)) return false;
  if (n(f.precioMinAed) != null && (r.precio == null || r.precio < f.precioMinAed!)) return false;
  if (n(f.precioMaxAed) != null && (r.precio == null || r.precio > f.precioMaxAed!)) return false;
  if (n(f.kmMin) != null && (r.km == null || r.km < f.kmMin!)) return false;
  if (n(f.kmMax) != null && (r.km == null || r.km > f.kmMax!)) return false;
  return true;
}

/** Filtra la lista (si no hay filtros, la devuelve tal cual). */
export function filtrar(filas: ResultadoScrapeado[], f: FiltrosScrape): ResultadoScrapeado[] {
  return hayFiltros(f) ? filas.filter((r) => coincide(r, f)) : filas;
}
