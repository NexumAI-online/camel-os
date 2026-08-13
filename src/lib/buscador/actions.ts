'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { SCRAPERS, APIFY_CONFIG } from './scrapers';
import { apifyConfigurada, iniciarActor } from './apify';
import { PORTALES, type Portal } from './types';
import { aAed, TOPE_APIFY } from './constants';
import type { FiltrosScrape } from './filtrar';

/** Descarta un resultado (Carlos lo marca como no interesante → se oculta). */
export async function descartarResultado(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('busqueda_resultados')
    .update({ descartado: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/buscador');
}

function numOf(v: FormDataEntryValue | null): number | undefined {
  const s = typeof v === 'string' ? v.replace(/\D/g, '') : '';
  if (s === '') return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Lee marca + filtros del formulario (compartido por buscar y filtrar). */
function leerFormulario(formData: FormData) {
  const make = String(formData.get('q') ?? '').trim();
  const specs = formData.getAll('specs').map(String).filter(Boolean);
  const portales = formData.getAll('portales').map(String).filter(Boolean);
  const anioMin = numOf(formData.get('anioMin'));
  const anioMax = numOf(formData.get('anioMax'));
  const kmMin = numOf(formData.get('kmMin'));
  const kmMax = numOf(formData.get('kmMax'));
  const precioMin = numOf(formData.get('precioMin'));
  const precioMax = numOf(formData.get('precioMax'));
  const moneda = String(formData.get('moneda') ?? 'AED');

  const filtros: FiltrosScrape = {
    specs,
    anioMin,
    anioMax,
    kmMin,
    kmMax,
    precioMinAed: precioMin != null ? Math.round(aAed(precioMin, moneda)) : undefined,
    precioMaxAed: precioMax != null ? Math.round(aAed(precioMax, moneda)) : undefined,
  };

  return { make, specs, portales, anioMin, anioMax, kmMin, kmMax, precioMin, precioMax, moneda, filtros };
}

/** Vuelca los filtros crudos a la query (para el tablero y el sondeo async). */
function ponerFiltros(
  params: URLSearchParams,
  d: ReturnType<typeof leerFormulario>,
) {
  for (const s of d.specs) params.append('specs', s);
  // Persistimos los portales elegidos para que los checks no se reseteen.
  for (const p of d.portales) params.append('portales', p);
  if (d.anioMin != null) params.set('anioMin', String(d.anioMin));
  if (d.anioMax != null) params.set('anioMax', String(d.anioMax));
  if (d.kmMin != null) params.set('kmMin', String(d.kmMin));
  if (d.kmMax != null) params.set('kmMax', String(d.kmMax));
  if (d.precioMin != null) params.set('precioMin', String(d.precioMin));
  if (d.precioMax != null) params.set('precioMax', String(d.precioMax));
  if (d.moneda && d.moneda !== 'AED') params.set('moneda', d.moneda);
}

/** Filtra SOLO el tablero (sin scrapear): navega con los filtros en la query. */
export async function filtrarTablero(formData: FormData) {
  const d = leerFormulario(formData);
  const params = new URLSearchParams();
  if (d.make) params.set('q', d.make);
  ponerFiltros(params, d);
  redirect(`/buscador?${params.toString()}`);
}

/**
 * Dispara la búsqueda de una marca en los portales elegidos, aplicando los
 * filtros ANTES de guardar (solo se ingesta lo que coincide).
 *   · Dubicars   → escaneo progresivo lado cliente (flag `scan_dubicars`): el
 *     tablero pide página a página y los coches van apareciendo, gratis.
 *   · YallaMotor → escaneo progresivo lado cliente con Chrome propio (flag
 *     `scan_yalla`): igual que Dubicars pero con navegador real. GRATIS, sin Apify.
 *   · Dubizzle   → corrida async de Apify (runId por query, tope 100). Único de pago.
 */
export async function buscarUnidades(formData: FormData) {
  const d = leerFormulario(formData);
  if (!d.make) redirect('/buscador');

  const pedidos = formData
    .getAll('portales')
    .map((p) => String(p))
    .filter((p) => PORTALES.some((x) => x.value === p)) as Portal[];

  const params = new URLSearchParams({ q: d.make });
  ponerFiltros(params, d);
  const fallidos: string[] = [];
  const sinCredito: string[] = [];
  const sinScraper = pedidos.filter((p) => !(p in SCRAPERS));
  if (sinScraper.length) params.set('sinmotor', sinScraper.join(','));

  // 1) Dubicars y YallaMotor: escaneo progresivo (lo arranca el cliente).
  //    Solo marcamos el flag; cada uno tiene su ruta y su componente.
  if (pedidos.includes('dubicars')) params.set('scan_dubicars', '1');
  if (pedidos.includes('yallamotor')) params.set('scan_yalla', '1');

  // 2) Apify (solo Dubizzle): lanzar corrida async y pasar el runId.
  const apifyPedidos = pedidos.filter((p) => p in APIFY_CONFIG);
  if (apifyPedidos.length && !apifyConfigurada()) {
    params.set('sintoken', apifyPedidos.join(','));
  } else {
    for (const portal of apifyPedidos) {
      try {
        const cfg = APIFY_CONFIG[portal]!;
        const runId = await iniciarActor(cfg.actorId, cfg.input(d.make, TOPE_APIFY));
        params.set(`run_${portal}`, runId);
      } catch (e) {
        if (/usage|paid-actor|402/i.test(String((e as Error).message))) sinCredito.push(portal);
        else fallidos.push(portal);
      }
    }
  }

  if (fallidos.length) params.set('fallidos', fallidos.join(','));
  if (sinCredito.length) params.set('sincredito', sinCredito.join(','));

  revalidatePath('/buscador');
  redirect(`/buscador?${params.toString()}`);
}
