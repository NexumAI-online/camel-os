'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';

import { ESTADOS, ORDENES } from '@/lib/vehiculos/types';

/**
 * Controles del listado de vehículos: búsqueda, filtros (marca/estado/mulkiya),
 * orden y selector de vista (lista/galería). NO hay botón "Filtrar": cada cambio
 * actualiza la URL al instante y la página vuelve a leer los resultados.
 */
export function ControlesVehiculos({ marcas }: { marcas: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const vista = sp.get('vista') === 'galeria' ? 'galeria' : 'lista';

  function aplicar(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => router.push(`/vehiculos?${params.toString()}`, { scroll: false }));
  }

  // Búsqueda de texto con debounce (auto-aplica sin apretar Enter).
  const [q, setQ] = useState(sp.get('q') ?? '');
  useEffect(() => {
    const actual = sp.get('q') ?? '';
    if (q === actual) return;
    const t = setTimeout(() => aplicar({ q: q || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selCls =
    'rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2 text-sm text-ink-1 outline-none transition-colors focus:border-accent';

  return (
    <div className="mt-6 space-y-3" aria-busy={pending}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Búsqueda de texto */}
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por marca, modelo o bastidor…"
            className="w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] py-2.5 pl-9 pr-3 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
          />
        </div>

        {/* Selector de vista */}
        <div className="inline-flex shrink-0 overflow-hidden rounded-c-md border border-[var(--w10)]">
          <button
            type="button"
            onClick={() => aplicar({ vista: undefined })}
            aria-pressed={vista === 'lista'}
            title="Vista de lista"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${vista === 'lista' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink-1'}`}
          >
            <List size={16} /> Lista
          </button>
          <button
            type="button"
            onClick={() => aplicar({ vista: 'galeria' })}
            aria-pressed={vista === 'galeria'}
            title="Vista de galería"
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${vista === 'galeria' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink-1'}`}
          >
            <LayoutGrid size={16} /> Galería
          </button>
        </div>
      </div>

      {/* Filtros + orden (auto-aplican) */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sp.get('marca') ?? ''}
          onChange={(e) => aplicar({ marca: e.target.value || undefined })}
          className={selCls}
          aria-label="Filtrar por marca"
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={sp.get('estado') ?? ''}
          onChange={(e) => aplicar({ estado: e.target.value || undefined })}
          className={selCls}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>

        <select
          value={sp.get('mulkiya') ?? ''}
          onChange={(e) => aplicar({ mulkiya: e.target.value || undefined })}
          className={selCls}
          aria-label="Filtrar por mulkiya"
        >
          <option value="">Mulkiya: todas</option>
          <option value="si">Con mulkiya</option>
          <option value="no">Sin mulkiya</option>
        </select>

        <select
          value={sp.get('orden') ?? 'reciente'}
          onChange={(e) => aplicar({ orden: e.target.value === 'reciente' ? undefined : e.target.value })}
          className={`${selCls} sm:ml-auto`}
          aria-label="Ordenar por"
        >
          {ORDENES.map((o) => (
            <option key={o.value} value={o.value}>Ordenar: {o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
