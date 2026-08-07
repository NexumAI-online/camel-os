import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  ExternalLink,
  X,
  Gauge,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Tag,
} from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { BotonBuscar } from '@/components/buscador/boton-buscar';
import { listarResultados } from '@/lib/buscador/db';
import { descartarResultado, buscarUnidades } from '@/lib/buscador/actions';
import { SCRAPERS } from '@/lib/buscador/scrapers';
import { PORTALES, etiquetaPortal, type Portal } from '@/lib/buscador/types';
import { SPECS, etiquetaSpec, MONEDAS, aAed } from '@/lib/buscador/constants';

export const dynamic = 'force-dynamic';

const nf = new Intl.NumberFormat('es-ES');

const PORTAL_CLS: Record<Portal, string> = {
  dubizzle: 'bg-danger/15 text-danger',
  yallamotor: 'bg-accent/15 text-accent-hi',
  dubicars: 'bg-ok/15 text-ok',
  fb_marketplace: 'bg-warn/15 text-warn',
};

// FB Marketplace queda afuera (viola ToS y es frágil).
const PORTALES_VISIBLES = PORTALES.filter((p) => p.value !== 'fb_marketplace');
const scrapeable = (v: string) => !!SCRAPERS[v as Portal];

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

type SP = { [k: string]: string | string[] | undefined };
const one = (sp: SP, k: string): string | undefined =>
  Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined);
const many = (sp: SP, k: string): string[] => {
  const v = sp[k];
  return Array.isArray(v) ? v : v ? [v] : [];
};

const inputCls =
  'w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent';

export default async function BuscadorPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const q = one(sp, 'q');
  const specs = many(sp, 'specs');
  const anioMin = num(one(sp, 'anioMin'));
  const anioMax = num(one(sp, 'anioMax'));
  const kmMin = num(one(sp, 'kmMin'));
  const kmMax = num(one(sp, 'kmMax'));
  const moneda = one(sp, 'moneda') ?? 'AED';
  const precioMin = num(one(sp, 'precioMin'));
  const precioMax = num(one(sp, 'precioMax'));

  const resultados = await listarResultados({
    q,
    specs,
    anioMin,
    anioMax,
    kmMin,
    kmMax,
    // El rango de precio se ingresa en la moneda elegida y se convierte a AED.
    precioMinAed: precioMin != null ? Math.round(aAed(precioMin, moneda)) : undefined,
    precioMaxAed: precioMax != null ? Math.round(aAed(precioMax, moneda)) : undefined,
  });

  // Aviso tras una corrida del scraper.
  const nuevos = num(one(sp, 'nuevos'));
  const vistos = num(one(sp, 'vistos'));
  const hayResumen = one(sp, 'vistos') != null;
  const fallidos = (one(sp, 'fallidos') ?? '').split(',').filter(Boolean);
  const sinmotor = (one(sp, 'sinmotor') ?? '').split(',').filter(Boolean);

  const hayFiltros =
    specs.length > 0 || anioMin != null || anioMax != null || kmMin != null ||
    kmMax != null || precioMin != null || precioMax != null;
  const limpiarHref = q ? `/buscador?q=${encodeURIComponent(q)}` : '/buscador';

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
          {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} · Dubicars · YallaMotor
        </p>
      </div>

      {/* Barra única de búsqueda: rastrea la marca en los portales elegidos */}
      <form action={buscarUnidades} className="glass-float mt-6 rounded-c-xl p-4">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            name="q"
            required
            autoFocus
            defaultValue={q ?? ''}
            placeholder="Busca una marca (ej: Porsche, Ferrari, Mercedes Benz)…"
            aria-label="Marca a buscar"
            className={`${inputCls} py-3 pl-11 text-base`}
          />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-ink-3">Buscar en:</span>
            {PORTALES_VISIBLES.map((p) => {
              const ok = scrapeable(p.value);
              return (
                <label
                  key={p.value}
                  title={ok ? '' : 'Muro anti-bot — próximamente'}
                  className={`inline-flex items-center gap-2 text-sm ${ok ? 'text-ink-1' : 'cursor-not-allowed text-ink-3'}`}
                >
                  <input
                    type="checkbox"
                    name="portales"
                    value={p.value}
                    defaultChecked={ok}
                    disabled={!ok}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  {p.label}
                  {!ok && <span className="text-xs">(pronto)</span>}
                </label>
              );
            })}
          </div>
          <BotonBuscar />
        </div>
        <p className="mt-2 text-xs text-ink-3">
          Enter para buscar. YallaMotor puede tardar unos segundos (usa navegador real).
        </p>
      </form>

      {/* Aviso del último rastreo */}
      {one(sp, 'error') ? (
        <div className="mt-4 flex items-center gap-2 rounded-c-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle size={16} /> No se pudo completar la búsqueda. Prueba de nuevo en un momento.
        </div>
      ) : hayResumen ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 rounded-c-md border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
            <CheckCircle2 size={16} />
            {nuevos && nuevos > 0
              ? `${nuevos} ${nuevos === 1 ? 'unidad nueva agregada' : 'unidades nuevas agregadas'} · ${vistos} vistas en los portales.`
              : `Sin novedades: las ${vistos ?? 0} unidades vistas ya estaban en el tablero.`}
          </div>
          {(fallidos.length > 0 || sinmotor.length > 0) && (
            <div className="flex items-center gap-2 rounded-c-md border border-warn/30 bg-warn/10 px-4 py-3 text-xs text-warn">
              <AlertTriangle size={14} />
              {fallidos.length > 0 && <span>Fallaron: {fallidos.map(etiquetaPortal).join(', ')}. </span>}
              {sinmotor.length > 0 && <span>Sin scraper aún: {sinmotor.map(etiquetaPortal).join(', ')}.</span>}
            </div>
          )}
        </div>
      ) : null}

      {/* Filtros (refinan el tablero; sin caja de texto: la barra de arriba es la búsqueda) */}
      <form className="glass-float mt-6 space-y-4 rounded-c-xl p-4" role="search">
        {/* Preserva la marca buscada al refinar */}
        <input type="hidden" name="q" value={q ?? ''} />

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Refinar resultados</p>
          {(hayFiltros || q) && (
            <Link href={limpiarHref} className="text-xs text-ink-3 transition-colors hover:text-ink-1">
              Limpiar filtros
            </Link>
          )}
        </div>

        {/* Specs */}
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-ink-2">Specs (origen)</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SPECS.map((s) => (
              <label key={s.value} className="inline-flex items-center gap-1.5 text-sm text-ink-1">
                <input type="checkbox" name="specs" value={s.value} defaultChecked={specs.includes(s.value)} className="h-4 w-4 accent-[var(--accent)]" />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Año */}
          <div>
            <span className="mb-2 block text-xs font-medium text-ink-2">Año</span>
            <div className="flex items-center gap-2">
              <input name="anioMin" defaultValue={one(sp, 'anioMin') ?? ''} inputMode="numeric" placeholder="Desde" className={inputCls} />
              <span className="text-ink-3">–</span>
              <input name="anioMax" defaultValue={one(sp, 'anioMax') ?? ''} inputMode="numeric" placeholder="Hasta" className={inputCls} />
            </div>
          </div>

          {/* Km */}
          <div>
            <span className="mb-2 block text-xs font-medium text-ink-2">Kilómetros</span>
            <div className="flex items-center gap-2">
              <input name="kmMin" defaultValue={one(sp, 'kmMin') ?? ''} inputMode="numeric" placeholder="Desde" className={inputCls} />
              <span className="text-ink-3">–</span>
              <input name="kmMax" defaultValue={one(sp, 'kmMax') ?? ''} inputMode="numeric" placeholder="Hasta" className={inputCls} />
            </div>
          </div>

          {/* Precio + moneda */}
          <div>
            <span className="mb-2 block text-xs font-medium text-ink-2">Precio</span>
            <div className="flex items-center gap-2">
              <input name="precioMin" defaultValue={one(sp, 'precioMin') ?? ''} inputMode="numeric" placeholder="Desde" className={inputCls} />
              <span className="text-ink-3">–</span>
              <input name="precioMax" defaultValue={one(sp, 'precioMax') ?? ''} inputMode="numeric" placeholder="Hasta" className={inputCls} />
              <select name="moneda" defaultValue={moneda} className={`${inputCls} w-auto`} title="Moneda del rango">
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>{m.value}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-c-md border border-[var(--w12)] px-4 py-2.5 text-sm font-medium text-ink-1 transition-colors hover:border-accent">
            Filtrar
          </button>
          {moneda !== 'AED' && (precioMin != null || precioMax != null) && (
            <span className="text-xs text-ink-3">Rango convertido a AED con tasa aprox.</span>
          )}
        </div>
      </form>

      {/* Resultados */}
      {resultados.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <Search size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">
            {q || hayFiltros ? 'No hay resultados con esos filtros.' : 'Todavía no hay unidades en el tablero.'}
          </p>
          <p className="text-xs text-ink-3">Escribe una marca arriba y toca “Buscar en portales”.</p>
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
                {r.specs && (
                  <span className="absolute right-11 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white">
                    <Tag size={11} /> {etiquetaSpec(r.specs)}
                  </span>
                )}
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
