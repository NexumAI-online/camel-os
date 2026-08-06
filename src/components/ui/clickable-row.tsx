'use client';

import { useRouter } from 'next/navigation';

/**
 * Fila de tabla clickeable en toda su superficie. Navega a `href` al hacer clic
 * en cualquier parte, salvo que el clic sea sobre un link o botón interno
 * (ej. "Ver PDF"), que maneja su propia acción.
 */
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        router.push(href);
      }}
      className={`cursor-pointer ${className ?? ''}`}
    >
      {children}
    </tr>
  );
}
