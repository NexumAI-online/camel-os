'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { SCRAPERS, APIFY_CONFIG } from './scrapers';
import { apifyConfigurada, iniciarActor } from './apify';
import { ingestarResultados } from './ingest';
import { PORTALES, type Portal } from './types';
import { TOPE_POR_TIENDA } from './constants';

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

/**
 * Dispara la búsqueda de una marca en los portales elegidos (checkboxes).
 * Flujo ASÍNCRONO para no bloquear:
 *   · Dubicars corre inline (fetch propio, rápido) → se ingesta ya.
 *   · YallaMotor/Dubizzle se LANZAN en Apify (async) → se pasa el runId por la
 *     query; el tablero sondea `/api/buscador/estado` y los suma al terminar.
 */
export async function buscarUnidades(formData: FormData) {
  const make = String(formData.get('q') ?? '').trim();
  if (!make) redirect('/buscador');

  const pedidos = formData
    .getAll('portales')
    .map((p) => String(p))
    .filter((p) => PORTALES.some((x) => x.value === p)) as Portal[];

  const params = new URLSearchParams({ q: make });
  const fallidos: string[] = [];
  const sinCredito: string[] = [];
  const sinScraper = pedidos.filter((p) => !(p in SCRAPERS));
  if (sinScraper.length) params.set('sinmotor', sinScraper.join(','));

  // 1) Dubicars: inline (rápido, gratis) → ingesta inmediata.
  if (pedidos.includes('dubicars')) {
    try {
      const filas = await SCRAPERS.dubicars!(make, { tope: TOPE_POR_TIENDA });
      const r = await ingestarResultados('dubicars', filas);
      params.set('nuevos', String(r.insertados));
      params.set('vistos', String(r.encontrados));
    } catch {
      fallidos.push('dubicars');
    }
  }

  // 2) Apify (YallaMotor/Dubizzle): lanzar corridas async y pasar el runId.
  const apifyPedidos = pedidos.filter((p) => p in APIFY_CONFIG);
  if (apifyPedidos.length && !apifyConfigurada()) {
    params.set('sintoken', apifyPedidos.join(','));
  } else {
    for (const portal of apifyPedidos) {
      try {
        const cfg = APIFY_CONFIG[portal]!;
        const runId = await iniciarActor(cfg.actorId, cfg.input(make, TOPE_POR_TIENDA));
        params.set(`run_${portal}`, runId);
      } catch (e) {
        // 402 = sin crédito de Apify (distinto de un fallo del scraper).
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
