'use client';

import { useFormStatus } from 'react-dom';
import { Radar, Loader2 } from 'lucide-react';

/**
 * Botón "Buscar en portales" con feedback de carga. Usa el estado del <form>
 * de rastreo (server action), así que al apretarlo — o al dar Enter en la barra —
 * muestra el spinner "Buscando…" hasta que vuelven los resultados.
 */
export function BotonBuscar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center justify-center gap-2 rounded-c-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi disabled:cursor-progress disabled:opacity-80"
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" /> Buscando…
        </>
      ) : (
        <>
          <Radar size={15} /> Buscar en portales
        </>
      )}
    </button>
  );
}
