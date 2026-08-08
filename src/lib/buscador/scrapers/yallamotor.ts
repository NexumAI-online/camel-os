import 'server-only';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec } from '../constants';
import { slugMarca, urlYallamotor } from '../marcas';
import { correrActor } from '../apify';

/**
 * Scraper de YallaMotor vía Apify (actor `stealth_mode/yallamotor-cars-search-scraper`).
 * YallaMotor bloquea el fetch de Node; Apify usa proxies/navegador y trae todo,
 * paginando solo. Devuelve un JSON rico por auto que mapeamos a `ResultadoScrapeado`.
 */

export const ACTOR_YALLA = 'stealth_mode~yallamotor-cars-search-scraper';

/** Input del actor para una marca y tope. */
export function inputYalla(make: string, tope: number): Record<string, unknown> {
  return {
    urls: [urlYallamotor(slugMarca(make))],
    max_items_per_url: Math.max(tope, 1),
    ignore_url_failures: true,
  };
}

/** Mapea los items del dataset del actor a nuestro modelo. */
export function mapearYalla(items: Record<string, unknown>[]): ResultadoScrapeado[] {
  return items.map((it) => {
    const marca = cap((it.make_name as string) ?? null);
    const modelo = (it.model_name as string)?.trim() || null;
    const anio = num(it.year);
    const titulo =
      ((it.title as string) ?? '').replace(/^Used\s+/i, '').trim() ||
      [anio, marca, modelo].filter(Boolean).join(' ') ||
      null;
    return {
      titulo,
      marca,
      modelo,
      anio,
      km: num(it.km_driven),
      precio: num(it.price),
      moneda: ((it.currency as string) || 'AED').trim(),
      specs: normalizarSpec(it.regional_specs as string),
      ubicacion: ((it.city as string) || (it.city_name as string) || '').trim() || null,
      url: urlDe(it),
      imagen_url: imagenDe(it),
      vendedor: ((it.auto_company_name as string) || '').trim() || null,
    };
  });
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseInt(v.replace(/\D/g, ''), 10) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

function cap(s?: string | null): string | null {
  const t = (s ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : null;
}

function imagenDe(it: Record<string, unknown>): string | null {
  const cands = [it.slideshow_picture, it.mobile_listing_main];
  for (const c of cands) if (typeof c === 'string' && c.startsWith('http')) return c;
  const pics = it.pictures;
  if (Array.isArray(pics) && typeof pics[0] === 'string') return pics[0] as string;
  return null;
}

function urlDe(it: Record<string, unknown>): string | null {
  const u = (it.complete_url ?? it.from_url) as string | undefined;
  if (!u) return null;
  return u.startsWith('http') ? u : `https://uae.yallamotor.com${u.startsWith('/') ? '' : '/'}${u}`;
}

export async function scrapeYallamotor(
  make: string,
  opts: { tope?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = slugMarca(make);
  if (!slug) return [];
  const items = await correrActor(ACTOR_YALLA, inputYalla(make, opts.tope ?? 300));
  return mapearYalla(items);
}
