import Link from 'next/link';
import { ArrowLeft, Search, AlertTriangle } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { BotonBuscar } from '@/components/buscador/boton-buscar';
import { EstadoBusqueda, type RunPortal } from '@/components/buscador/estado-busqueda';
import { EscaneoDubicars } from '@/components/buscador/escaneo-dubicars';
import { EscaneoYallamotor } from '@/components/buscador/escaneo-yallamotor';
import { TableroResultados } from '@/components/buscador/tablero-resultados';
import { listarResultados } from '@/lib/buscador/db';
import { descartarResultado, buscarUnidades, filtrarTablero } from '@/lib/buscador/actions';
import { SCRAPERS } from '@/lib/buscador/scrapers';
import { PORTALES, etiquetaPortal, type Portal } from '@/lib/buscador/types';
import { SPECS, MONEDAS, aAed, LIMITE_TABLERO } from '@/lib/buscador/constants';

export const dynamic = 'force-dynamic';

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
  const portalesSel = many(sp, 'portales');
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
  const fallidos = (one(sp, 'fallidos') ?? '').split(',').filter(Boolean);
  const sinmotor = (one(sp, 'sinmotor') ?? '').split(',').filter(Boolean);
  const sintoken = (one(sp, 'sintoken') ?? '').split(',').filter(Boolean);
  const sincredito = (one(sp, 'sincredito') ?? '').split(',').filter(Boolean);

  // Corridas async de Apify en curso (solo Dubizzle; YallaMotor ya no usa Apify).
  const runs: RunPortal[] = [];
  for (const portal of ['dubizzle']) {
    const run = one(sp, `run_${portal}`);
    if (run) runs.push({ portal, run });
  }
  // Escaneos progresivos lado cliente (los arranca el cliente página a página).
  const scanDubicars = one(sp, 'scan_dubicars') === '1' && !!q;
  const scanYalla = one(sp, 'scan_yalla') === '1' && !!q;
  const hayAviso =
    scanDubicars || scanYalla || runs.length > 0 || fallidos.length > 0 ||
    sinmotor.length > 0 || sintoken.length > 0 || sincredito.length > 0;

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
          {resultados.length >= LIMITE_TABLERO ? `${LIMITE_TABLERO}+` : resultados.length}{' '}
          {resultados.length === 1 ? 'coincide' : 'coinciden'} · Dubicars · YallaMotor
        </p>
      </div>

      {/* Búsqueda + filtros: los filtros y el máximo se aplican ANTES de traer resultados */}
      <form action={buscarUnidades} className="glass-float mt-6 space-y-4 rounded-c-xl p-4">
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

        {/* Portales */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-ink-3">Buscar en:</span>
          {PORTALES_VISIBLES.map((p) => {
            const ok = scrapeable(p.value);
            // Si ya se buscó, respetamos lo que estaba marcado (no se resetea);
            // si no, el default (Dubicars + YallaMotor sí, Dubizzle no por el costo).
            const porDefecto = ok && (portalesSel.length ? portalesSel.includes(p.value) : p.value !== 'dubizzle');
            return (
              <label
                key={p.value}
                title={ok ? '' : 'Muro anti-bot — próximamente'}
                className={`inline-flex items-center gap-2 text-sm ${ok ? 'text-ink-1' : 'cursor-not-allowed text-ink-3'}`}
              >
                <input type="checkbox" name="portales" value={p.value} defaultChecked={porDefecto} disabled={!ok} className="h-4 w-4 accent-[var(--accent)]" />
                {p.label}
                {!ok && <span className="text-xs">(pronto)</span>}
                {p.value === 'dubizzle' && ok && <span className="text-xs text-ink-3">(+ crédito)</span>}
              </label>
            );
          })}
        </div>

        {/* Filtros (se aplican antes de guardar los resultados) */}
        <div className="border-t border-[var(--w06)] pt-4">
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

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="mb-2 block text-xs font-medium text-ink-2">Año</span>
              <div className="flex items-center gap-2">
                <input name="anioMin" defaultValue={one(sp, 'anioMin') ?? ''} inputMode="numeric" placeholder="Desde" className={inputCls} />
                <span className="text-ink-3">–</span>
                <input name="anioMax" defaultValue={one(sp, 'anioMax') ?? ''} inputMode="numeric" placeholder="Hasta" className={inputCls} />
              </div>
            </div>
            <div>
              <span className="mb-2 block text-xs font-medium text-ink-2">Kilómetros</span>
              <div className="flex items-center gap-2">
                <input name="kmMin" defaultValue={one(sp, 'kmMin') ?? ''} inputMode="numeric" placeholder="Desde" className={inputCls} />
                <span className="text-ink-3">–</span>
                <input name="kmMax" defaultValue={one(sp, 'kmMax') ?? ''} inputMode="numeric" placeholder="Hasta" className={inputCls} />
              </div>
            </div>
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
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3">
          <BotonBuscar />
          <button type="submit" formAction={filtrarTablero} className="rounded-c-md border border-[var(--w12)] px-4 py-2.5 text-sm font-medium text-ink-1 transition-colors hover:border-accent">
            Filtrar tablero
          </button>
          {(hayFiltros || q) && (
            <Link href={limpiarHref} className="text-xs text-ink-3 transition-colors hover:text-ink-1">
              Limpiar
            </Link>
          )}
          {moneda !== 'AED' && (precioMin != null || precioMax != null) && (
            <span className="text-xs text-ink-3">Precio convertido a AED (tasa aprox.).</span>
          )}
        </div>

        <p className="text-xs text-ink-3">
          Enter para buscar. Los filtros se aplican antes de guardar los resultados; “Filtrar tablero” solo refina lo ya cargado (gratis).
        </p>
      </form>

      {/* Aviso del último rastreo + estado progresivo de las corridas async */}
      {one(sp, 'error') ? (
        <div className="mt-4 flex items-center gap-2 rounded-c-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle size={16} /> No se pudo completar la búsqueda. Prueba de nuevo en un momento.
        </div>
      ) : hayAviso ? (
        <div className="mt-4 space-y-2">
          {/* Escaneo progresivo de Dubicars (contador en vivo hasta el total).
              La `key` incluye marca+filtros: una búsqueda nueva remonta y reinicia. */}
          {scanDubicars && q && (
            <EscaneoDubicars
              key={[q, specs.join(','), anioMin, anioMax, kmMin, kmMax, precioMin, precioMax, moneda].join('|')}
              make={q}
            />
          )}
          {/* Escaneo progresivo de YallaMotor (Chrome propio, sin Apify). */}
          {scanYalla && q && (
            <EscaneoYallamotor
              key={['y', q, specs.join(','), anioMin, anioMax, kmMin, kmMax, precioMin, precioMax, moneda].join('|')}
              make={q}
            />
          )}
          {/* Chips por portal de Apify (se van completando solos) */}
          <EstadoBusqueda runs={runs} />
          {(fallidos.length > 0 || sinmotor.length > 0 || sintoken.length > 0) && (
            <div className="flex items-center gap-2 rounded-c-md border border-warn/30 bg-warn/10 px-4 py-3 text-xs text-warn">
              <AlertTriangle size={14} />
              {fallidos.length > 0 && <span>Fallaron: {fallidos.map(etiquetaPortal).join(', ')}. </span>}
              {sinmotor.length > 0 && <span>Sin scraper aún: {sinmotor.map(etiquetaPortal).join(', ')}. </span>}
              {sintoken.length > 0 && <span>Falta APIFY_TOKEN para: {sintoken.map(etiquetaPortal).join(', ')}. </span>}
              {sincredito.length > 0 && <span>Sin crédito de Apify para: {sincredito.map(etiquetaPortal).join(', ')} (recargá en console.apify.com/billing).</span>}
            </div>
          )}
        </div>
      ) : null}

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
        <TableroResultados resultados={resultados} descartar={descartarResultado} />
      )}
    </main>
  );
}
