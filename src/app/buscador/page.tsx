import Link from 'next/link';
import { ArrowLeft, Search, ExternalLink, X, Gauge, Calendar, MapPin } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { listarResultados } from '@/lib/buscador/db';
import { descartarResultado } from '@/lib/buscador/actions';
import { PORTALES, etiquetaPortal, type Portal } from '@/lib/buscador/types';

export const dynamic = 'force-dynamic';

const nf = new Intl.NumberFormat('es-ES');

const PORTAL_CLS: Record<Portal, string> = {
  dubizzle: 'bg-danger/15 text-danger',
  yallamotor: 'bg-accent/15 text-accent-hi',
  dubicars: 'bg-ok/15 text-ok',
  fb_marketplace: 'bg-warn/15 text-warn',
};

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function BuscadorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; portal?: string; precioMax?: string; anioMin?: string }>;
}) {
  const sp = await searchParams;
  const resultados = await listarResultados({
    q: sp.q,
    portal: sp.portal,
    precioMax: num(sp.precioMax),
    anioMin: num(sp.anioMin),
  });

  const inputCls =
    'w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent';

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Centro de control
        </Link>
      </header>

      <div className="mt-8">
        <p className="eyebrow">Buscador</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
          Unidades en Dubái
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} · Dubizzle · YallaMotor · Dubicars · FB Marketplace
        </p>
      </div>

      {/* Filtros */}
      <form className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5" role="search">
        <div className="relative col-span-2 sm:col-span-1 lg:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Marca, modelo o título…" className={`${inputCls} pl-9`} />
        </div>
        <select name="portal" defaultValue={sp.portal ?? ''} className={inputCls}>
          <option value="">Todos los portales</option>
          {PORTALES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input name="anioMin" defaultValue={sp.anioMin ?? ''} inputMode="numeric" placeholder="Año desde" className={inputCls} />
        <input name="precioMax" defaultValue={sp.precioMax ?? ''} inputMode="numeric" placeholder="Precio máx (AED)" className={inputCls} />
        <button type="submit" className="col-span-2 rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi sm:col-span-4 lg:col-span-1">
          Filtrar
        </button>
      </form>

      {/* Resultados */}
      {resultados.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <Search size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">No hay resultados con esos filtros.</p>
          <p className="text-xs text-ink-3">Los scrapers de los portales van a ir llenando este tablero.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((r) => (
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
                {/* Descartar */}
                <form action={descartarResultado.bind(null, r.id)} className="absolute right-2 top-2">
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
      )}
    </main>
  );
}
