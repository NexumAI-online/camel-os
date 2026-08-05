import { cn } from '@/lib/utils';

const SIZES = {
  sm: { camel: 'text-lg', cars: 'text-[7px]', gap: 'mt-0.5' },
  md: { camel: 'text-2xl', cars: 'text-[9px]', gap: 'mt-1' },
  lg: { camel: 'text-4xl', cars: 'text-[13px]', gap: 'mt-1.5' },
} as const;

/**
 * Logo tipográfico de Camel Export Cars, versión para fondo oscuro.
 * Se construye con DOM real (no <img>) para que la fuente Archivo de next/font
 * se aplique de verdad: un SVG con <text> no tendría acceso a la webfont.
 */
export function Logo({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];

  return (
    <div className={cn('select-none leading-none', className)} aria-label="Camel Export Cars">
      <div className={cn('font-display font-black tracking-tight', s.camel)}>
        <span className="text-camel-white">CAMEL</span>{' '}
        <span className="text-camel-blue">EXPORT.</span>
      </div>
      <div
        className={cn(
          'font-display font-bold uppercase tracking-brand text-camel-gray',
          s.cars,
          s.gap,
        )}
      >
        Cars
      </div>
    </div>
  );
}
