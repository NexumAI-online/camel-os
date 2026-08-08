'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

import { etiquetaPortal } from '@/lib/buscador/types';

type Estado = 'corriendo' | 'listo' | 'error';
export interface RunPortal {
  portal: string;
  run: string;
}

/**
 * Sondea el estado de las corridas de Apify lanzadas por la búsqueda y muestra
 * un chip por portal. Cuando una termina, refresca el tablero para que aparezcan
 * sus resultados. Así la carga es progresiva (no se espera a todas).
 */
export function EstadoBusqueda({ runs }: { runs: RunPortal[] }) {
  const router = useRouter();
  const [estados, setEstados] = useState<Record<string, { e: Estado; nuevos?: number }>>(
    () => Object.fromEntries(runs.map((r) => [r.portal, { e: 'corriendo' as Estado }])),
  );
  const listos = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (runs.length === 0) return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const { portal, run } of runs) {
      const sondear = async () => {
        if (cancelado || listos.current.has(portal)) return;
        try {
          const res = await fetch(`/api/buscador/estado?portal=${portal}&run=${run}`, {
            cache: 'no-store',
          });
          const j = await res.json();
          if (j.estado === 'corriendo') {
            timers.push(setTimeout(sondear, 4000));
            return;
          }
          listos.current.add(portal);
          setEstados((s) => ({ ...s, [portal]: { e: j.estado, nuevos: j.nuevos } }));
          if (j.estado === 'listo') router.refresh();
        } catch {
          timers.push(setTimeout(sondear, 5000));
        }
      };
      sondear();
    }

    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (runs.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {runs.map(({ portal }) => {
        const st = estados[portal]?.e ?? 'corriendo';
        const base =
          'inline-flex items-center gap-1.5 rounded-c-md border px-3 py-1.5 text-xs';
        if (st === 'listo') {
          return (
            <span key={portal} className={`${base} border-ok/30 bg-ok/10 text-ok`}>
              <CheckCircle2 size={13} /> {etiquetaPortal(portal)}: +{estados[portal]?.nuevos ?? 0} nuevas
            </span>
          );
        }
        if (st === 'error') {
          return (
            <span key={portal} className={`${base} border-danger/30 bg-danger/10 text-danger`}>
              <AlertTriangle size={13} /> {etiquetaPortal(portal)}: error
            </span>
          );
        }
        return (
          <span key={portal} className={`${base} border-[var(--w10)] text-ink-2`}>
            <Loader2 size={13} className="animate-spin" /> {etiquetaPortal(portal)}: buscando…
          </span>
        );
      })}
    </div>
  );
}
