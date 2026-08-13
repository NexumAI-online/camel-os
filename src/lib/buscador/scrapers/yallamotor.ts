import 'server-only';

import type { ResultadoScrapeado } from '../types';
import { normalizarSpec, normalizarColor } from '../constants';
import { slugMarca, urlYallamotor } from '../marcas';
import { conNavegador } from '../../browser';

/**
 * Scraper de YallaMotor con NUESTRO propio Chrome (sin Apify).
 * YallaMotor bloquea el `fetch` de Node (fingerprint TLS) pero un navegador
 * real pasa sin problema. La página trae un JSON-LD `ItemList` (schema.org
 * Product/Car) server-rendered con todos los datos por coche → lo parseamos
 * (mucho más estable que selectores CSS).
 *
 * URL por marca:  https://uae.yallamotor.com/used-cars/{make}
 * Paginación:     ?page=N   (22 coches por página)
 * Total:          "283 Used Porsche Cars" en el HTML → última página = ceil(total/22).
 *                 Más allá de la última, YallaMotor REDIRIGE (no devuelve vacío),
 *                 así que el fin se detecta por el total / la URL final, no por
 *                 "página vacía" (mismo patrón que Dubicars).
 */

/** Coches por página de YallaMotor (constante del portal). */
export const PAGINA_YALLA = 22;

/** Techo de seguridad de páginas (anti-bucle; el corte real va por el total). */
export const MAX_PAGINAS_YALLA = 120;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** Campos que nos interesan del nodo `Car` del JSON-LD. */
interface CarLd {
  name?: string;
  url?: string;
  brand?: { name?: string };
  model?: string;
  vehicleModelDate?: string | number;
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

function cap(s?: string | null): string | null {
  const t = (s ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : null;
}

/**
 * Specs y ciudad viven en la `description`:
 *   "Used Porsche Cayenne 2024 for sale in Dubai: AED 359,999, 21,355 km, Automatic, GCC Specs."
 */
function specsDeDescripcion(desc?: string) {
  const m = (desc ?? '').match(/([A-Za-z]+)\s+Specs/i);
  return normalizarSpec(m ? m[1] : desc ?? null);
}
function ciudadDeDescripcion(desc?: string): string | null {
  const m = (desc ?? '').match(/for sale in ([A-Za-z ]+?)\s*:/i);
  return m ? m[1].trim() : null;
}

/** Extrae los `Car` del JSON-LD `ItemList` de una página ya descargada. */
export function parsearItemsYalla(html: string): ResultadoScrapeado[] {
  const bloques = [
    ...html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  const cars: CarLd[] = [];
  for (const b of bloques) {
    let j: unknown;
    try {
      j = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const nodos = Array.isArray(j) ? j : [j];
    for (const n of nodos as Record<string, unknown>[]) {
      if (n && n['@type'] === 'ItemList' && Array.isArray(n.itemListElement)) {
        for (const el of n.itemListElement as Record<string, unknown>[]) {
          const item = el.item as CarLd | undefined;
          if (item) cars.push(item);
        }
      }
    }
  }

  return cars.map((c) => {
    const anio = num(c.vehicleModelDate);
    const marca = cap(c.brand?.name ?? null);
    const modelo = c.model ? cap(c.model) : null;
    const titulo =
      (c.name ?? '').replace(/^Used\s+/i, '').trim() ||
      [anio, marca, modelo].filter(Boolean).join(' ') ||
      null;
    return {
      titulo,
      marca,
      modelo,
      anio,
      km: num(c.mileageFromOdometer?.value),
      precio: num(c.offers?.price),
      moneda: (c.offers?.priceCurrency || 'AED').trim(),
      specs: specsDeDescripcion(c.description),
      color: normalizarColor(c.color),
      ubicacion: ciudadDeDescripcion(c.description),
      url: (c.url || '').trim() || null,
      imagen_url: (c.image || '').trim() || null,
      vendedor: null,
    };
  });
}

/** Total de anuncios de la marca ("283 Used Porsche Cars" / "of 283 results"). */
export function parsearTotalYalla(html: string): number | null {
  const m =
    html.match(/of\s+([\d,]+)\s+(?:results|cars)/i) ??
    html.match(/([\d,]+)\s+Used\s+[\w-]+\s+Cars/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

/** Descarga el HTML de una página de listado con Chrome real. */
async function htmlPagina(url: string): Promise<{ html: string; urlFinal: string } | null> {
  return conNavegador(async (navegador) => {
    const pagina = await navegador.newPage();
    await pagina.setUserAgent(UA);
    await pagina.setViewport({ width: 1366, height: 900 });
    const resp = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (!resp || !resp.ok()) return null;
    // El JSON-LD es server-rendered, pero damos margen por si hidrata.
    await pagina
      .waitForSelector('script[type="application/ld+json"]', { timeout: 8000 })
      .catch(() => {});
    return { html: await pagina.content(), urlFinal: pagina.url() };
  });
}

/** Resultado de escanear UNA página de YallaMotor (para la carga progresiva). */
export interface PaginaYalla {
  filas: ResultadoScrapeado[];
  totalMarca: number | null;
  hayMas: boolean;
  topeAlcanzado: boolean;
}

/**
 * Trae UNA sola página de YallaMotor. La usa el escaneo progresivo: el cliente
 * pide página 1, 2, 3… y esta ingesta lo que coincide, así los coches aparecen
 * a medida que se encuentran sin bloquear en una única llamada larga.
 */
export async function paginaYallamotor(make: string, page: number): Promise<PaginaYalla> {
  const slug = slugMarca(make);
  if (!slug) return { filas: [], totalMarca: null, hayMas: false, topeAlcanzado: false };

  const base = urlYallamotor(slug);
  const url = page > 1 ? `${base}?page=${page}` : base;

  const r = await htmlPagina(url);
  if (!r) {
    if (page === 1) throw new Error('YallaMotor no respondió');
    return { filas: [], totalMarca: null, hayMas: false, topeAlcanzado: false };
  }

  // Marca desconocida o más allá de la última página → YallaMotor REDIRIGE.
  // Si la URL final ya no tiene el slug de la marca, es fin de marca.
  if (!r.urlFinal.includes(`/used-cars/${slug}`)) {
    return { filas: [], totalMarca: null, hayMas: false, topeAlcanzado: false };
  }

  const filas = parsearItemsYalla(r.html);
  const totalMarca = parsearTotalYalla(r.html);

  // Última página = ceil(total / 22). Sin total, caemos al techo de seguridad.
  const ultima = totalMarca ? Math.ceil(totalMarca / PAGINA_YALLA) : MAX_PAGINAS_YALLA;
  const faltanPaginas = page < ultima;
  const hayMas = filas.length > 0 && faltanPaginas && page < MAX_PAGINAS_YALLA;
  const topeAlcanzado = filas.length > 0 && faltanPaginas && page >= MAX_PAGINAS_YALLA;

  return { filas, totalMarca, hayMas, topeAlcanzado };
}

/**
 * Scrape completo de YallaMotor (recorre páginas hasta `tope`). Lo usa el
 * registro `SCRAPERS`; el flujo del tablero usa el escaneo progresivo de arriba.
 */
export async function scrapeYallamotor(
  make: string,
  opts: { tope?: number } = {},
): Promise<ResultadoScrapeado[]> {
  const slug = slugMarca(make);
  if (!slug) return [];
  const tope = Math.max(opts.tope ?? 300, 1);

  const out: ResultadoScrapeado[] = [];
  const vistos = new Set<string>();

  for (let page = 1; page <= MAX_PAGINAS_YALLA && out.length < tope; page++) {
    const { filas, hayMas } = await paginaYallamotor(make, page);
    if (filas.length === 0) break;
    for (const f of filas) {
      const clave = f.url ?? f.titulo ?? '';
      if (clave && vistos.has(clave)) continue;
      if (clave) vistos.add(clave);
      out.push(f);
    }
    if (!hayMas) break;
  }

  return out.slice(0, tope);
}
