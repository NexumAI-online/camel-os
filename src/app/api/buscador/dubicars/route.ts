import { paginaDubicars } from '@/lib/buscador/scrapers/dubicars';
import { ingestarResultados } from '@/lib/buscador/ingest';
import { filtrosDeQuery } from '@/lib/buscador/filtros-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Escaneo progresivo de Dubicars: una página por llamada. El cliente pide
 * página 1, 2, 3… y esta ruta trae esa página, la filtra e ingesta (solo se
 * guarda lo que coincide), devolviendo el avance para el contador en vivo.
 *
 * Respuesta:
 *   estado        'ok' | 'error'
 *   pagina        nº de página escaneada
 *   cochesPagina  coches que trajo la página (antes de filtrar)
 *   coincidentes  cuántos de esa página cumplen los filtros
 *   insertados    cuántos se guardaron nuevos (el resto ya estaban)
 *   totalMarca    total del inventario de la marca (viene en cada página)
 *   hayMas        si quedan más páginas de la marca por traer
 *   topeAlcanzado se cortó por el techo de seguridad (faltan coches)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const make = (url.searchParams.get('make') ?? '').trim();
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);

  if (!make || !Number.isFinite(page) || page < 1) {
    return Response.json({ estado: 'error' }, { status: 400 });
  }

  try {
    const { filas, totalMarca, hayMas, topeAlcanzado } = await paginaDubicars(make, page);
    const r = await ingestarResultados('dubicars', filas, filtrosDeQuery(url.searchParams));
    return Response.json({
      estado: 'ok',
      pagina: page,
      cochesPagina: filas.length,
      coincidentes: r.encontrados,
      insertados: r.insertados,
      totalMarca,
      hayMas,
      topeAlcanzado,
    });
  } catch (e) {
    return Response.json({ estado: 'error', motivo: (e as Error).message }, { status: 502 });
  }
}
