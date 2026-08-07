'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { SCRAPERS } from './scrapers';
import { ingestarResultados } from './ingest';
import { PORTALES, type Portal } from './types';

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

  // Portales elegidos que además tengan scraper implementado.
  const pedidos = formData
    .getAll('portales')
    .map((p) => String(p))
    .filter((p) => PORTALES.some((x) => x.value === p)) as Portal[];
  const conScraper = pedidos.filter((p) => p in SCRAPERS);
  const sinScraper = pedidos.filter((p) => !(p in SCRAPERS));

  if (conScraper.length === 0) {
    redirect(`/buscador?q=${encodeURIComponent(make)}&sinmotor=${sinScraper.join(',')}`);
  }

  let insertados = 0;
  let vistos = 0;
  const fallidos: string[] = [];

  for (const portal of conScraper) {
    try {
      const filas = await SCRAPERS[portal]!(make, { paginas: 2 });
      const r = await ingestarResultados(portal, filas);
      insertados += r.insertados;
      vistos += r.encontrados;
    } catch {
      fallidos.push(portal);
    }
  }

  const params = new URLSearchParams({
    q: make,
    nuevos: String(insertados),
    vistos: String(vistos),
  });
  if (fallidos.length) params.set('fallidos', fallidos.join(','));
  if (sinScraper.length) params.set('sinmotor', sinScraper.join(','));

  revalidatePath('/buscador');
  redirect(`/buscador?${params.toString()}`);
}
