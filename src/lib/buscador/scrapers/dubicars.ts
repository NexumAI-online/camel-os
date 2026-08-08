import 'server-only';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec, MAX_PAGINAS_DUBICARS } from '../constants';
import { slugMarca } from '../marcas';

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

const MAX_PAGINAS = 20; // (solo para el scrapeDubicars legacy)

/**
 * Coches por página de Dubicars (constante del portal). Sirve para saber cuál es
 * la última página a partir del total: `ceil(total / 30)`. Es clave porque
 * Dubicars, si pides una página MÁS ALLÁ de la última, REPITE la última en vez
 * de devolver vacío — así que no podemos detectar el fin por "página vacía".
 */
const PAGINA_DUBICARS = 30;

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

/**
 * Total de anuncios de la marca que anuncia Dubicars (sin filtrar).
 * Está en un `<span class="search-results-count"> 413 results </span>` y también
 * en el `<h1> 413 Used Porsche cars`. Es el total del inventario de la marca,
 * no de las coincidencias con los filtros (Dubicars filtra en el cliente).
 */
export function parsearTotalMarca(html: string): number | null {
  const m =
    html.match(/search-results-count[^>]*>\s*([\d,]+)\s*results/i) ??
    html.match(/>\s*([\d,]+)\s+used\s+[\w-]+\s+cars/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
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
 * Rastrea Dubicars para una marca y devuelve los anuncios (hasta `tope`).
 * Es `fetch` puro (sin navegador ni Apify): rápido, gratis y confiable.
 * @param make  Marca a buscar (ej. "Porsche", "Mercedes Benz").
 * @param opts.tope  Máximo de resultados a traer (default 300).
 */
/** Resultado de escanear UNA página de Dubicars (para la carga progresiva). */
export interface PaginaDubicars {
  filas: ResultadoScrapeado[];
  /** Total de la marca que anuncia el portal (viene en cada página). */
  totalMarca: number | null;
  /** ¿Quedan más páginas de la marca por traer? */
  hayMas: boolean;
  /** Se cortó por el techo de seguridad (no por fin de marca) → faltan coches. */
  topeAlcanzado: boolean;
}

/**
 * Trae UNA sola página de Dubicars. La usa el escaneo progresivo: el cliente
 * pide página 1, 2, 3… y va ingiriendo, así los coches aparecen a medida que
 * se encuentran sin bloquear en una única llamada larga.
 * @param make  Marca a buscar.
 * @param page  Nº de página (1-based).
 */
export async function paginaDubicars(make: string, page: number): Promise<PaginaDubicars> {
  const slug = slugMarca(make);
  if (!slug) return { filas: [], totalMarca: null, hayMas: false, topeAlcanzado: false };

  const url =
    `https://www.dubicars.com/uae/used/${encodeURIComponent(slug)}` +
    (page > 1 ? `?page=${page}` : '');

  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en' },
    cache: 'no-store',
  });
  if (!res.ok) {
    if (page === 1) throw new Error(`Dubicars respondió ${res.status}`);
    return { filas: [], totalMarca: null, hayMas: false, topeAlcanzado: false };
  }

  // Marca desconocida: Dubicars redirige el slug a `/uae/used` (el listado
  // genérico de TODAS las marcas). Lo detectamos por la URL final y devolvemos
  // vacío, para no ensuciar el tablero con coches de otras marcas.
  if (!res.url.includes(`/used/${slug}`)) {
    return { filas: [], totalMarca: 0, hayMas: false, topeAlcanzado: false };
  }

  const html = await res.text();
  const filas = parsearPagina(html);
  const totalMarca = parsearTotalMarca(html);

  // La última página es `ceil(total / 30)`. Seguimos mientras no la hayamos
  // alcanzado (y sin pasar el techo de seguridad). Si no hay total, caemos al
  // techo. NO usamos "página vacía" porque Dubicars repite la última.
  const ultima = totalMarca ? Math.ceil(totalMarca / PAGINA_DUBICARS) : MAX_PAGINAS_DUBICARS;
  const faltanPaginas = page < ultima;
  const hayMas = filas.length > 0 && faltanPaginas && page < MAX_PAGINAS_DUBICARS;
  const topeAlcanzado = filas.length > 0 && faltanPaginas && page >= MAX_PAGINAS_DUBICARS;

  return { filas, totalMarca, hayMas, topeAlcanzado };
}

export async function scrapeDubicars(
  make: string,
  opts: { tope?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = slugMarca(make);
  if (!slug) return [];
  const tope = Math.max(opts.tope ?? 300, 1);
  const paginas = Math.min(Math.ceil(tope / 28) + 1, MAX_PAGINAS);

  const out: ResultadoScrapeado[] = [];
  const vistos = new Set<string>();

  for (let page = 1; page <= paginas && out.length < tope; page++) {
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

  return out.slice(0, tope);
}
