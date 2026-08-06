import Link from 'next/link';
import { ArrowLeft, Plus, Search, Car } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { listarVehiculos } from '@/lib/vehiculos/db';
import { etiquetaEstado, type EstadoVehiculo } from '@/lib/vehiculos/types';

export const dynamic = 'force-dynamic';

const nf = new Intl.NumberFormat('es-ES');

const ESTADO_CLS: Record<EstadoVehiculo, string> = {
  en_dubai: 'bg-accent/15 text-accent-hi',
  en_transito: 'bg-warn/15 text-warn',
  en_espana: 'bg-ok/15 text-ok',
  vendido: 'surface-2 text-ink-3',
};

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const vehiculos = await listarVehiculos(q);

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

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Base de Datos</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
            Vehículos
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {vehiculos.length} {vehiculos.length === 1 ? 'unidad' : 'unidades'}
            {q ? ` · filtrando “${q}”` : ''}
          </p>
        </div>
        <Link
          href="/vehiculos/nuevo"
          className="inline-flex items-center gap-2 rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi"
        >
          <Plus size={16} /> Nuevo vehículo
        </Link>
      </div>

      {/* Búsqueda (GET) */}
      <form className="mt-6 flex items-center gap-2" role="search">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar por marca, modelo o bastidor…"
            className="w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] py-2.5 pl-9 pr-3 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-c-md border border-[var(--w12)] px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink-1"
        >
          Buscar
        </button>
      </form>

      {/* Listado */}
      {vehiculos.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <Car size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">
            {q ? 'Ningún vehículo coincide con la búsqueda.' : 'Todavía no hay vehículos cargados.'}
          </p>
          {!q && (
            <Link href="/vehiculos/nuevo" className="text-sm font-semibold text-accent-hi hover:underline">
              Cargar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="glass-float mt-6 overflow-x-auto rounded-c-xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--w08)] text-xs uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3 font-medium">Vehículo</th>
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="px-4 py-3 font-medium">Km</th>
                <th className="px-4 py-3 font-medium">Bastidor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Precio (AED)</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id} className="group border-b border-[var(--w06)] last:border-0 transition-colors hover:bg-[var(--w04)]">
                  <td className="px-4 py-3">
                    <Link href={`/vehiculos/${v.id}`} className="block">
                      <span className="font-semibold text-ink-1 group-hover:text-accent-hi">
                        {v.marca} {v.modelo}
                      </span>
                      {v.color && <span className="ml-2 text-xs text-ink-3">{v.color}</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{v.anio ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-2">{v.km != null ? nf.format(v.km) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">{v.bastidor ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_CLS[v.estado]}`}>
                      {etiquetaEstado(v.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-1">
                    {v.precio_compra != null ? nf.format(v.precio_compra) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
