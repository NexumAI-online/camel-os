import 'server-only';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec } from '../constants';

/**
 * Scraper de Dubicars (Feature 3 · motor worker in-repo).
 *
 * No hace falta navegador headless: la página de resultados devuelve el HTML
 * completo con un atributo `data-mixpanel-detail` por tarjeta que contiene un
 * JSON plano con todos los datos del vehículo. Parsear ese JSON es mucho más
 * estable que apoyarse en selectores CSS/clases (que Dubicars cambia seguido).
 *
 * URL canónica por marca:  https://www.dubicars.com/uae/used/{make}
 * Paginación:              ?page=N
 * Precios en el JSON:      item_local_price = AED · item_export_price = USD
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_PAGINAS = 5;

/** Campos que nos interesan del JSON embebido en cada tarjeta. */
interface MixpanelDetail {
  item_make?: string;
  item_model?: string;
  item_trim?: string;
  item_year?: number;
  item_mileage?: number;
  item_specs?: string;
  item_location?: string;
  item_local_price?: number;
  item_discounted_price?: number;
  seller_name?: string;
  image_url?: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** "STD" (o vacío) no aporta nada al título; lo descartamos. */
function limpiarTrim(trim?: string): string | null {
  const t = (trim ?? '').trim();
  if (!t || /^std$/i.test(t)) return null;
  return t;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Extrae las tarjetas de una página de resultados ya descargada. */
function parsearPagina(html: string): ResultadoScrapeado[] {
  const filas: ResultadoScrapeado[] = [];
  // El valor del atributo no contiene comillas literales (van como &quot;),
  // así que [^"]+ delimita el JSON con seguridad.
  const re = /data-mixpanel-detail="([^"]+)"/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    let d: MixpanelDetail;
    try {
      d = JSON.parse(decodeEntities(m[1]));
    } catch {
      continue;
    }

    // La URL del anuncio es el primer link .html que aparece tras la tarjeta.
    const ventana = html.slice(m.index, m.index + 4000);
    const href = ventana.match(
      /href="(https:\/\/www\.dubicars\.com\/[a-z0-9-]+\.html)"/i,
    );

    const trim = limpiarTrim(d.item_trim);
    const titulo =
      [d.item_year, d.item_make, d.item_model, trim].filter(Boolean).join(' ') ||
      null;

    filas.push({
      titulo,
      marca: d.item_make?.trim() || null,
      modelo: d.item_model?.trim() || null,
      anio: num(d.item_year),
      km: num(d.item_mileage),
      precio: num(d.item_discounted_price) ?? num(d.item_local_price),
      moneda: 'AED',
      specs: normalizarSpec(d.item_specs),
      ubicacion: d.item_location?.trim() || null,
      url: href ? href[1] : null,
      imagen_url: d.image_url?.trim() || null,
      vendedor: d.seller_name?.trim() || null,
    });
  }

  return filas;
}

/**
 * Rastrea Dubicars para una marca y devuelve los anuncios encontrados.
 * @param make  Marca a buscar (ej. "Porsche", "Mercedes Benz").
 * @param opts.paginas  Cuántas páginas recorrer (1–5, default 2).
 */
export async function scrapeDubicars(
  make: string,
  opts: { paginas?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = make.trim().toLowerCase().replace(/\s+/g, '-');
  if (!slug) return [];
  const paginas = Math.min(Math.max(opts.paginas ?? 2, 1), MAX_PAGINAS);

  const out: ResultadoScrapeado[] = [];
  const vistos = new Set<string>();

  for (let page = 1; page <= paginas; page++) {
    const url =
      `https://www.dubicars.com/uae/used/${encodeURIComponent(slug)}` +
      (page > 1 ? `?page=${page}` : '');

    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'en' },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (page === 1) throw new Error(`Dubicars respondió ${res.status}`);
      break; // una página intermedia falló: cortamos con lo que haya
    }

    const filas = parsearPagina(await res.text());
    if (filas.length === 0) break; // no hay más páginas

    for (const f of filas) {
      const clave = f.url ?? f.titulo ?? '';
      if (clave && vistos.has(clave)) continue;
      if (clave) vistos.add(clave);
      out.push(f);
    }
  }

  return out;
}
