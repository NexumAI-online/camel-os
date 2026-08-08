'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { SCRAPERS, PORTALES_APIFY } from './scrapers';
import { apifyConfigurada } from './apify';
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
 * Rastrea una marca en los portales seleccionados y persiste los anuncios
 * nuevos. Los portales llegan como checkboxes (name="portales"). Al terminar
 * redirige al tablero con un resumen en la query — sin JS de cliente.
 */
export async function buscarUnidades(formData: FormData) {
  // La barra única manda su valor como `q` (mismo campo que filtra el tablero).
  const make = String(formData.get('q') ?? '').trim();
  if (!make) redirect('/buscador');

  // Portales elegidos que tengan scraper implementado.
  const pedidos = formData
    .getAll('portales')
    .map((p) => String(p))
    .filter((p) => PORTALES.some((x) => x.value === p)) as Portal[];
  let conScraper = pedidos.filter((p) => p in SCRAPERS);
  const sinScraper = pedidos.filter((p) => !(p in SCRAPERS));

  // Portales de Apify que quedan afuera si falta el token.
  const sinToken: Portal[] = [];
  if (!apifyConfigurada()) {
    conScraper = conScraper.filter((p) => {
      if (PORTALES_APIFY.includes(p)) { sinToken.push(p); return false; }
      return true;
    });
  }

  if (conScraper.length === 0) {
    const params = new URLSearchParams({ q: make });
    if (sinToken.length) params.set('sintoken', sinToken.join(','));
    if (sinScraper.length) params.set('sinmotor', sinScraper.join(','));
    redirect(`/buscador?${params.toString()}`);
  }

  // Corremos todos los portales en paralelo (cada uno hasta `tope`).
  const resultados = await Promise.allSettled(
    conScraper.map(async (portal) => {
      const filas = await SCRAPERS[portal]!(make, { tope: TOPE_POR_TIENDA });
      const r = await ingestarResultados(portal, filas);
      return { portal, ...r };
    }),
  );

  let insertados = 0;
  let vistos = 0;
  const fallidos: string[] = [];
  resultados.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      insertados += res.value.insertados;
      vistos += res.value.encontrados;
    } else {
      fallidos.push(conScraper[i]);
    }
  });

  const params = new URLSearchParams({
    q: make,
    nuevos: String(insertados),
    vistos: String(vistos),
  });
  if (fallidos.length) params.set('fallidos', fallidos.join(','));
  if (sinScraper.length) params.set('sinmotor', sinScraper.join(','));
  if (sinToken.length) params.set('sintoken', sinToken.join(','));

  revalidatePath('/buscador');
  redirect(`/buscador?${params.toString()}`);
}
