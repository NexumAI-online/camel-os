'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

/** Query string con los filtros vigentes (para filtrar el escaneo antes de guardar). */
function filtrosQS(sp: URLSearchParams): string {
  const p = new URLSearchParams();
  for (const s of sp.getAll('specs')) p.append('specs', s);
  for (const k of ['anioMin', 'anioMax', 'kmMin', 'kmMax', 'precioMin', 'precioMax', 'moneda']) {
    const v = sp.get(k);
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `&${s}` : '';
}

const nf = new Intl.NumberFormat('es-ES');
const MAX_PAGINAS = 130;

type Fase = 'escaneando' | 'listo' | 'error';

/**
 * Escaneo progresivo de YallaMotor con NUESTRO Chrome (sin Apify): pide página
 * 1, 2, 3… a `/api/buscador/yallamotor`, cada una ingesta lo que coincide y
 * refresca el tablero, así los coches van apareciendo. El contador "coinciden"
 * sube hasta el total real, mostrando también el total de la marca.
 *
 * Nota: cada página abre un navegador real, así que es más lento que Dubicars
 * (fetch) — pero es gratis y no depende del límite de Apify.
 */
export function EscaneoYallamotor({ make }: { make: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fase, setFase] = useState<Fase>('escaneando');
  const [coinciden, setCoinciden] = useState(0);
  const [escaneadas, setEscaneadas] = useState(0);
  const [totalMarca, setTotalMarca] = useState<number | null>(null);
  const [tope, setTope] = useState(false);

  useEffect(() => {
    // Sin guard de "ya arrancó": en StrictMode (dev) el effect corre dos veces;
    // la limpieza de la 1ª marca `cancelado` y la 2ª arranca el escaneo real
    // (mismo patrón que EscaneoDubicars). En producción se monta una sola vez.
    let cancelado = false;
    const qs = filtrosQS(searchParams as unknown as URLSearchParams);

    const escanear = async () => {
      for (let page = 1; page <= MAX_PAGINAS; page++) {
        if (cancelado) return;
        let j: {
          estado: string;
          cochesPagina?: number;
          coincidentes?: number;
          totalMarca?: number | null;
          hayMas?: boolean;
          topeAlcanzado?: boolean;
        };
        try {
          const res = await fetch(
            `/api/buscador/yallamotor?make=${encodeURIComponent(make)}&page=${page}${qs}`,
            { cache: 'no-store' },
          );
          j = await res.json();
        } catch {
          if (cancelado) return;
          setFase('error');
          return;
        }
        if (cancelado) return;
        if (j.estado !== 'ok') {
          if (page === 1) setFase('error');
          else setFase('listo');
          return;
        }

        setEscaneadas((n) => n + (j.cochesPagina ?? 0));
        setCoinciden((n) => n + (j.coincidentes ?? 0));
        if (page === 1 && j.totalMarca != null) setTotalMarca(j.totalMarca);
        router.refresh(); // el tablero muestra las nuevas filas

        if (!j.hayMas) {
          if (j.topeAlcanzado) setTope(true);
          setFase('listo');
          return;
        }
      }
      setTope(true);
      setFase('listo');
    };

    escanear();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detalle = (
    <>
      <strong className="font-semibold">{nf.format(coinciden)}</strong> coinciden ·{' '}
      {nf.format(escaneadas)} escaneadas
      {totalMarca != null && <> · {nf.format(totalMarca)} en la marca</>}
      {tope && totalMarca != null && escaneadas < totalMarca && <> (tope {nf.format(escaneadas)})</>}
    </>
  );

  const base = 'mt-4 inline-flex items-center gap-2 rounded-c-md border px-3 py-1.5 text-xs';
  if (fase === 'error') {
    return (
      <div className={`${base} border-danger/30 bg-danger/10 text-danger`}>
        <AlertTriangle size={13} /> YallaMotor: no se pudo escanear. Prueba de nuevo.
      </div>
    );
  }
  if (fase === 'listo') {
    return (
      <div className={`${base} border-ok/30 bg-ok/10 text-ok`}>
        <CheckCircle2 size={13} /> YallaMotor: {detalle}
      </div>
    );
  }
  return (
    <div className={`${base} border-[var(--w10)] text-ink-2`}>
      <Loader2 size={13} className="animate-spin" /> YallaMotor: escaneando… {detalle}
    </div>
  );
}
