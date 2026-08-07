import Link from 'next/link';
import { ArrowLeft, Plus, Car, FileText, Calendar, Gauge, Check } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { ClickableRow } from '@/components/ui/clickable-row';
import { ControlesVehiculos } from '@/components/vehiculos/controles-vehiculos';
import { listarVehiculos, listarMarcas } from '@/lib/vehiculos/db';
import { etiquetaEstado, type EstadoVehiculo, type Vehiculo } from '@/lib/vehiculos/types';

export const dynamic = 'force-dynamic';

const nf = new Intl.NumberFormat('es-ES');

const ESTADO_CLS: Record<EstadoVehiculo, string> = {
  en_dubai: 'bg-accent/15 text-accent-hi',
  en_transito: 'bg-warn/15 text-warn',
  en_espana: 'bg-ok/15 text-ok',
  vendido: 'surface-2 text-ink-3',
};

/** Chips de documentos (nombres) compartidos por lista y galería. */
function DocsChips({ docs, max = 2 }: { docs: Vehiculo['documentos']; max?: number }) {
  if (docs.length === 0) return <span className="text-xs text-ink-3">—</span>;
  return (
    <div className="flex max-w-[240px] flex-col gap-1">
      {docs.slice(0, max).map((d) => (
        <span key={d.path} className="inline-flex items-center gap-1.5 text-xs text-ink-2" title={d.nombre}>
          <FileText size={12} className="shrink-0 text-ink-3" />
          <span className="truncate">{d.nombre}</span>
        </span>
      ))}
      {docs.length > max && <span className="text-xs text-ink-3">+{docs.length - max} más</span>}
    </div>
  );
}

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    estado?: string;
    mulkiya?: string;
    orden?: string;
    vista?: string;
  }>;
}) {
  const sp = await searchParams;
  const [vehiculos, marcas] = await Promise.all([
    listarVehiculos({
      q: sp.q,
      marca: sp.marca,
      estado: sp.estado,
      mulkiya: sp.mulkiya,
      orden: sp.orden,
    }),
    listarMarcas(),
  ]);

  const vista = sp.vista === 'galeria' ? 'galeria' : 'lista';
  const hayFiltros = !!(sp.q || sp.marca || sp.estado || sp.mulkiya);

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
            {hayFiltros ? ' · filtrado' : ''}
          </p>
        </div>
        <Link
          href="/vehiculos/nuevo"
          className="inline-flex items-center gap-2 rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi"
        >
          <Plus size={16} /> Nuevo vehículo
        </Link>
      </div>

      <ControlesVehiculos marcas={marcas} />

      {/* Vacío */}
      {vehiculos.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <Car size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">
            {hayFiltros ? 'Ningún vehículo coincide con los filtros.' : 'Todavía no hay vehículos cargados.'}
          </p>
          {!hayFiltros && (
            <Link href="/vehiculos/nuevo" className="text-sm font-semibold text-accent-hi hover:underline">
              Cargar el primero
            </Link>
          )}
        </div>
      ) : vista === 'galeria' ? (
        /* ── Vista galería ── */
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehiculos.map((v) => (
            <Link
              key={v.id}
              href={`/vehiculos/${v.id}`}
              className="glass-float group flex flex-col overflow-hidden rounded-c-xl transition-colors hover:border-accent"
            >
              <div className="relative aspect-[16/10] overflow-hidden surface-2">
                {v.fotos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.fotos[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-3">
                    <Car size={28} strokeWidth={1.5} />
                  </div>
                )}
                <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_CLS[v.estado]}`}>
                  {etiquetaEstado(v.estado)}
                </span>
                {v.mulquilla && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white">
                    <Check size={11} /> Mulkiya
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-semibold leading-tight text-ink-1 group-hover:text-accent-hi">
                  {v.marca} {v.modelo}
                  {v.color && <span className="ml-2 text-xs font-normal text-ink-3">{v.color}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
                  {v.anio != null && <span className="inline-flex items-center gap-1"><Calendar size={12} /> {v.anio}</span>}
                  {v.km != null && <span className="inline-flex items-center gap-1"><Gauge size={12} /> {nf.format(v.km)} km</span>}
                  {v.bastidor && <span className="font-mono">{v.bastidor}</span>}
                </div>
                <div className="mt-3">
                  <DocsChips docs={v.documentos} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="font-display text-lg font-bold text-accent-hi">
                    {v.precio_compra != null ? `${nf.format(v.precio_compra)} AED` : '—'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* ── Vista lista ── */
        <div className="glass-float mt-6 overflow-x-auto rounded-c-xl">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--w08)] text-xs uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3 font-medium">Vehículo</th>
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="px-4 py-3 font-medium">Km</th>
                <th className="px-4 py-3 font-medium">Bastidor</th>
                <th className="px-4 py-3 text-center font-medium">Mulkiya</th>
                <th className="px-4 py-3 font-medium">Documentos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Precio (AED)</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <ClickableRow key={v.id} href={`/vehiculos/${v.id}`} className="group border-b border-[var(--w06)] last:border-0 transition-colors hover:bg-[var(--w04)]">
                  <td className="px-4 py-3">
                    <Link href={`/vehiculos/${v.id}`} className="flex items-center gap-3">
                      {v.fotos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.fotos[0].url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="surface-2 flex h-10 w-14 shrink-0 items-center justify-center rounded text-ink-3">
                          <Car size={16} strokeWidth={1.5} />
                        </span>
                      )}
                      <span>
                        <span className="font-semibold text-ink-1 group-hover:text-accent-hi">
                          {v.marca} {v.modelo}
                        </span>
                        {v.color && <span className="ml-2 text-xs text-ink-3">{v.color}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{v.anio ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-2">{v.km != null ? nf.format(v.km) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">{v.bastidor ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={v.mulquilla}
                      readOnly
                      aria-label="Mulkiya"
                      title={v.mulquilla ? 'Tiene mulkiya' : 'Sin mulkiya'}
                      className="h-4 w-4 accent-[var(--accent)] align-middle"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DocsChips docs={v.documentos} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_CLS[v.estado]}`}>
                      {etiquetaEstado(v.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-1">
                    {v.precio_compra != null ? nf.format(v.precio_compra) : '—'}
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
