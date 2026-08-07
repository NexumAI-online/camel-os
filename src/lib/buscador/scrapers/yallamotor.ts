import 'server-only';

import type { Browser } from 'puppeteer-core';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec } from '../constants';
import { conNavegador } from '@/lib/browser';

/**
 * Scraper de YallaMotor (Feature 3 · motor worker in-repo).
 *
 * YallaMotor bloquea el `fetch` de Node (responde 403 por fingerprint TLS),
 * así que cargamos la página con Chrome real (Puppeteer, mismo motor que los
 * PDFs). La página incluye un bloque JSON-LD `ItemList` (schema.org) con cada
 * auto como Product/Car: name, url, brand, model, año, precio+moneda, km, color,
 * y las specs dentro del texto de `description`. Parsear ese JSON-LD es mucho
 * más estable que los selectores del HTML.
 *
 * URL por marca:  https://uae.yallamotor.com/used-cars/{make}
 * Paginación:     ?page=N
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_PAGINAS = 5;

interface CarItem {
  name?: string;
  url?: string;
  brand?: { name?: string } | string;
  model?: string;
  vehicleModelDate?: string;
  description?: string;
  image?: string;
  color?: string;
  mileageFromOdometer?: { value?: number };
  offers?: { price?: number; priceCurrency?: string };
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseInt(v.replace(/\D/g, ''), 10) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

function marcaDe(brand: CarItem['brand']): string | null {
  const raw = typeof brand === 'string' ? brand : brand?.name;
  if (!raw) return null;
  // "porsche" → "Porsche"
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Saca las specs y la ubicación del texto de `description`. */
function specsDe(desc?: string): string | null {
  if (!desc) return null;
  const m = desc.match(/([A-Za-z]+)\s+Specs?/i);
  return normalizarSpec(m ? m[1] : null);
}
function ubicacionDe(desc?: string): string | null {
  if (!desc) return null;
  const m = desc.match(/for sale in ([A-Za-z\s]+?)[:,]/i);
  return m ? m[1].trim() : null;
}

/** Extrae los autos del `ItemList` JSON-LD de una página. */
function parsearPagina(html: string): ResultadoScrapeado[] {
  const bloques = html.match(
    /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!bloques) return [];

  for (const bloque of bloques) {
    const jsonTxt = bloque.replace(/<script[^>]*>|<\/script>/gi, '').trim();
    let data: unknown;
    try {
      data = JSON.parse(jsonTxt);
    } catch {
      continue;
    }
    const obj = data as { '@type'?: string; itemListElement?: Array<{ item?: CarItem }> };
    if (obj['@type'] !== 'ItemList' || !Array.isArray(obj.itemListElement)) continue;

    return obj.itemListElement
      .map((el) => el.item)
      .filter((it): it is CarItem => !!it && !!it.url)
      .map((it) => ({
        titulo: it.name?.replace(/^Used\s+/i, '').trim() || null,
        marca: marcaDe(it.brand),
        modelo: it.model?.trim() || null,
        anio: num(it.vehicleModelDate),
        km: num(it.mileageFromOdometer?.value),
        precio: num(it.offers?.price),
        moneda: it.offers?.priceCurrency?.trim() || 'AED',
        specs: specsDe(it.description),
        ubicacion: ubicacionDe(it.description),
        url: it.url ?? null,
        imagen_url: it.image ?? null,
        vendedor: null,
      }));
  }

  return [];
}

/**
 * Rastrea YallaMotor para una marca y devuelve los anuncios encontrados.
 * @param make  Marca a buscar (ej. "Porsche", "Mercedes Benz").
 * @param opts.paginas  Cuántas páginas recorrer (1–5, default 2).
 */
export async function scrapeYallamotor(
  make: string,
  opts: { paginas?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = make.trim().toLowerCase().replace(/\s+/g, '-');
  if (!slug) return [];
  const paginas = Math.min(Math.max(opts.paginas ?? 2, 1), MAX_PAGINAS);

  // Un solo navegador para todas las páginas (se cierra al final).
  return conNavegador(async (navegador: Browser) => {
    const pagina = await navegador.newPage();
    await pagina.setUserAgent(UA);

    const out: ResultadoScrapeado[] = [];
    const vistos = new Set<string>();

    for (let page = 1; page <= paginas; page++) {
      const url =
        `https://uae.yallamotor.com/used-cars/${encodeURIComponent(slug)}` +
        (page > 1 ? `?page=${page}` : '');

      const resp = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      if (!resp || !resp.ok()) {
        if (page === 1) throw new Error(`YallaMotor respondió ${resp?.status() ?? '??'}`);
        break;
      }

      const filas = parsearPagina(await pagina.content());
      if (filas.length === 0) break;

      for (const f of filas) {
        const clave = f.url ?? f.titulo ?? '';
        if (clave && vistos.has(clave)) continue;
        if (clave) vistos.add(clave);
        out.push(f);
      }
    }

    return out;
  });
}
