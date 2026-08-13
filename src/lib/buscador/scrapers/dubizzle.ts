import 'server-only';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec, normalizarColor } from '../constants';
import { slugMarca, urlDubizzle } from '../marcas';
import { correrActor } from '../apify';

/**
 * Scraper de Dubizzle vía Apify (actor `powerbox/dubizzle-motors-used-cars-listing-scraper`).
 * Dubizzle está protegido por PerimeterX; el actor lo sortea con proxies.
 * El título viene como "Marca - Modelo - Versión"; de ahí sacamos marca/modelo.
 */

export const ACTOR_DUBIZZLE = 'powerbox~dubizzle-motors-used-cars-listing-scraper';

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseInt(v.replace(/\D/g, ''), 10) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

export function inputDubizzle(make: string, tope: number): Record<string, unknown> {
  return { searchUrl: urlDubizzle(slugMarca(make)), maxItems: Math.max(tope, 1) };
}

export function mapearDubizzle(items: Record<string, unknown>[]): ResultadoScrapeado[] {
  return items.map((it) => {
    const titulo = ((it.title as string) || '').trim();
    const partes = titulo.split(/\s*-\s*/); // "Porsche - Panamera - Turbo"
    return {
      titulo: ((it.subheading as string) || titulo) || null,
      marca: partes[0]?.trim() || null,
      modelo: partes[1]?.trim() || null,
      anio: num(it.year),
      km: num(it.kms),
      precio: num(it.price),
      moneda: 'AED',
      specs: normalizarSpec(it.regionalSpecs as string),
      color: normalizarColor(
        (it.exteriorColor as string) ?? (it.color as string) ?? (it.exterior_color as string) ?? null,
      ),
      ubicacion: ((it.location as string) || '').trim() || null,
      url: ((it.url as string) || '').trim() || null,
      imagen_url: ((it.imageUrl as string) || '').trim() || null,
      vendedor: null,
    };
  });
}

export async function scrapeDubizzle(
  make: string,
  opts: { tope?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = slugMarca(make);
  if (!slug) return [];
  const items = await correrActor(ACTOR_DUBIZZLE, inputDubizzle(make, opts.tope ?? 300), {
    timeoutSecs: 290,
  });
  return mapearDubizzle(items);
}
