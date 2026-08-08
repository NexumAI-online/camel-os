import { estadoRun, itemsDeRun } from '@/lib/buscador/apify';
import { APIFY_CONFIG } from '@/lib/buscador/scrapers';
import { ingestarResultados } from '@/lib/buscador/ingest';
import { PORTALES, type Portal } from '@/lib/buscador/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sondeo del estado de una corrida de Apify (lo llama el tablero cada pocos
 * segundos). Si la corrida terminó OK, trae sus items, los mapea e ingesta,
 * y devuelve cuántos se agregaron. Estados: corriendo | listo | error.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const portal = url.searchParams.get('portal') as Portal | null;
  const run = url.searchParams.get('run');

  if (!portal || !run || !PORTALES.some((p) => p.value === portal) || !(portal in APIFY_CONFIG)) {
    return Response.json({ estado: 'error' }, { status: 400 });
  }

  const st = await estadoRun(run);
  if (st === 'corriendo') return Response.json({ estado: 'corriendo' });
  if (st === 'error') return Response.json({ estado: 'error' });

  // Terminó OK → traer, mapear e ingestar.
  try {
    const items = await itemsDeRun(run);
    const filas = APIFY_CONFIG[portal]!.mapear(items);
    const r = await ingestarResultados(portal, filas);
    return Response.json({ estado: 'listo', nuevos: r.insertados, vistos: r.encontrados });
  } catch (e) {
    return Response.json({ estado: 'error', motivo: (e as Error).message }, { status: 502 });
  }
}
