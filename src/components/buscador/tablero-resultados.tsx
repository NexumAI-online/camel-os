'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, X, Gauge, Calendar, MapPin, Tag, Plus, Palette } from 'lucide-react';

import { etiquetaPortal, type Portal, type Resultado } from '@/lib/buscador/types';
import { etiquetaSpec, POR_PAGINA, INCREMENTO } from '@/lib/buscador/constants';

const nf = new Intl.NumberFormat('es-ES');

const PORTAL_CLS: Record<Portal, string> = {
  dubizzle: 'bg-danger/15 text-danger',
  yallamotor: 'bg-accent/15 text-accent-hi',
  dubicars: 'bg-ok/15 text-ok',
  fb_marketplace: 'bg-warn/15 text-warn',
};

type Orden = 'recientes' | 'precio-asc' | 'precio-desc' | 'portal';

/** Compara por precio dejando SIEMPRE los sin-precio al final. */
function cmpPrecio(a: Resultado, b: Resultado, desc: boolean): number {
  if (a.precio == null && b.precio == null) return 0;
  if (a.precio == null) return 1;
  if (b.precio == null) return -1;
  return desc ? b.precio - a.precio : a.precio - b.precio;
}

/**
 * Grilla de resultados con controles de orden (botones) y filtro por color,
 * más "Cargar más". El orden y el filtro se aplican en cliente sobre lo YA
 * guardado (instantáneo, sin re-scrapear).
 */
export function TableroResultados({
  resultados,
  descartar,
}: {
  resultados: Resultado[];
  descartar: (id: string) => Promise<void>;
}) {
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [orden, setOrden] = useState<Orden>('recientes');
  const [color, setColor] = useState<string | null>(null);

  // Colores presentes en los resultados (para los chips de filtro).
  const colores = useMemo(
    () => [...new Set(resultados.map((r) => r.color).filter((c): c is string => !!c))].sort(),
    [resultados],
  );

  // Aplica filtro de color + orden (copia antes de ordenar, no muta el original).
  const procesadas = useMemo(() => {
    const arr = color ? resultados.filter((r) => r.color === color) : resultados.slice();
    switch (orden) {
      case 'precio-asc':
        return arr.sort((a, b) => cmpPrecio(a, b, false));
      case 'precio-desc':
        return arr.sort((a, b) => cmpPrecio(a, b, true));
      case 'portal':
        return arr.sort((a, b) => etiquetaPortal(a.portal).localeCompare(etiquetaPortal(b.portal)));
      default:
        return arr; // recientes = orden de hallazgo (el que ya trae la lista)
    }
  }, [resultados, orden, color]);

  const mostrados = procesadas.slice(0, visibles);
  const restantes = procesadas.length - mostrados.length;

  return (
    <>
      {/* Controles: orden (botones) + filtro de color (chips) */}
      <div className="mt-6 flex flex-col gap-3 rounded-c-lg border border-[var(--w06)] bg-[var(--inputDeep)]/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-3">Ordenar:</span>
          <div className="flex flex-wrap gap-1.5">
            <Btn activo={orden === 'recientes'} onClick={() => setOrden('recientes')}>Recientes</Btn>
            <Btn activo={orden === 'precio-asc'} onClick={() => setOrden('precio-asc')}>Precio ↑</Btn>
            <Btn activo={orden === 'precio-desc'} onClick={() => setOrden('precio-desc')}>Precio ↓</Btn>
            <Btn activo={orden === 'portal'} onClick={() => setOrden('portal')}>Portal</Btn>
          </div>
        </div>

        {colores.length > 0 && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-3">
              <Palette size={13} /> Color:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Btn activo={color === null} onClick={() => setColor(null)}>Todos</Btn>
              {colores.map((c) => (
                <Btn key={c} activo={color === c} onClick={() => setColor(c)}>
                  {c}
                </Btn>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                {r.color && <span className="inline-flex items-center gap-1"><Palette size={12} /> {r.color}</span>}
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

/** Botón chico de control (orden / color), con estado activo. */
function Btn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-c-sm px-3 py-1.5 text-xs font-medium transition-colors ${
        activo
          ? 'bg-accent text-white'
          : 'border border-[var(--w10)] text-ink-2 hover:border-accent hover:text-ink-1'
      }`}
    >
      {children}
    </button>
  );
}
