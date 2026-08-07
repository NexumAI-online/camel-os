'use client';

import { useFormStatus } from 'react-dom';

/** Botón de submit con estado "pendiente" (usa el estado del <form> padre). */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-c-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi disabled:opacity-50"
    >
      {pending ? 'Guardando…' : children}
    </button>
  );
}

/** Botón "×" para eliminar una foto puntual (con confirmación). */
export function FotoDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm('¿Eliminar esta foto?')) e.preventDefault();
      }}
      title="Eliminar foto"
      className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white transition-colors hover:bg-danger disabled:opacity-50"
    >
      ×
    </button>
  );
}

/** Botón "×" para eliminar un documento puntual (con confirmación). */
export function DocDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm('¿Eliminar este documento?')) e.preventDefault();
      }}
      title="Eliminar documento"
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-c-md border border-[var(--w12)] text-sm leading-none text-ink-3 transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
    >
      ×
    </button>
  );
}

/** Botón de eliminar con confirmación. Va dentro de su propio <form>. */
export function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm('¿Eliminar este vehículo? Esta acción no se puede deshacer.')) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center justify-center gap-2 rounded-c-md border border-[var(--w12)] px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
    >
      {pending ? 'Eliminando…' : 'Eliminar'}
    </button>
  );
}
