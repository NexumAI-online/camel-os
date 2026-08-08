'use client';

import { useState } from 'react';
import { ExternalLink, X, Gauge, Calendar, MapPin, Tag, Plus } from 'lucide-react';

import { etiquetaPortal, type Portal, type Resultado } from '@/lib/buscador/types';
import { etiquetaSpec, POR_PAGINA, INCREMENTO } from '@/lib/buscador/constants';

const nf = new Intl.NumberFormat('es-ES');

const PORTAL_CLS: Record<Portal, string> = {
  dubizzle: 'bg-danger/15 text-danger',
  yallamotor: 'bg-accent/15 text-accent-hi',
  dubicars: 'bg-ok/15 text-ok',
  fb_marketplace: 'bg-warn/15 text-warn',
};

/**
 * Grilla de resultados con "Cargar más". Muestra `POR_PAGINA` (100) de entrada y
 * revela `INCREMENTO` (50) más por pulsación, sobre lo YA guardado: instantáneo
 * y sin volver a scrapear (el escaneo de fondo es quien llena la base).
 */
export function TableroResultados({
  resultados,
  descartar,
}: {
  resultados: Resultado[];
  descartar: (id: string) => Promise<void>;
}) {
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const mostrados = resultados.slice(0, visibles);
  const restantes = resultados.length - mostrados.length;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mostrados.map((r) => (
          <div key={r.id} className="glass-float group relative flex flex-col overflow-hidden rounded-c-xl">
            {/* Imagen */}
            <div className="relative aspect-[16/10] overflow-hidden surface-2">
              {r.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imagen_url} alt={r.titulo ?? ''} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-3">Sin foto</div>
              )}
              <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${PORTAL_CLS[r.portal]}`}>
                {etiquetaPortal(r.portal)}
              </span>
              {r.specs && (
                <span className="absolute right-11 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white">
                  <Tag size={11} /> {etiquetaSpec(r.specs)}
                </span>
              )}
              {/* Descartar */}
              <form action={descartar.bind(null, r.id)} className="absolute right-2 top-2">
                <button
                  type="submit"
                  title="Descartar"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-danger"
                >
                  <X size={15} />
                </button>
              </form>
            </div>

            {/* Datos */}
            <div className="flex flex-1 flex-col p-4">
              <p className="font-semibold leading-tight text-ink-1">
                {r.titulo || [r.marca, r.modelo].filter(Boolean).join(' ') || 'Unidad'}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                {r.anio != null && <span className="inline-flex items-center gap-1"><Calendar size={12} /> {r.anio}</span>}
                {r.km != null && <span className="inline-flex items-center gap-1"><Gauge size={12} /> {nf.format(r.km)} km</span>}
                {r.ubicacion && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {r.ubicacion}</span>}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-display text-lg font-bold text-accent-hi">
                  {r.precio != null ? `${nf.format(r.precio)} ${r.moneda}` : '—'}
                </span>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink-2 transition-colors hover:text-accent-hi"
                  >
                    Ver anuncio <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {restantes > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibles((v) => v + INCREMENTO)}
            className="inline-flex items-center gap-2 rounded-c-md border border-[var(--w12)] px-5 py-2.5 text-sm font-medium text-ink-1 transition-colors hover:border-accent"
          >
            <Plus size={15} /> Cargar más ({nf.format(Math.min(INCREMENTO, restantes))} de {nf.format(restantes)})
          </button>
        </div>
      )}
    </>
  );
}
