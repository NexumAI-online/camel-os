/**
 * Fondo M0 · "Obsidiana".
 *
 * Tres capas estáticas, decorativas y sin interacción:
 *   1. Glow volumétrico azul muy tenue (radial-gradients al 4–6%).
 *   2. Retícula técnica de 44px enmascarada radialmente (se desvanece a los bordes).
 *   3. Grano (feTurbulence) al 2,5% para que el obsidiana no se vea plano.
 *
 * Server Component: todo CSS puro.
 */
export function NightRoad() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 1 · Glow volumétrico estático */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(90% 55% at 50% -8%, rgba(30, 111, 242, 0.06) 0%, transparent 55%),
            radial-gradient(60% 45% at 88% 8%, rgba(77, 143, 255, 0.05) 0%, transparent 50%),
            radial-gradient(75% 55% at 12% 100%, rgba(30, 111, 242, 0.04) 0%, transparent 55%)
          `,
        }}
      />

      {/* 2 · Retícula técnica enmascarada */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--gridC) 1px, transparent 1px), linear-gradient(90deg, var(--gridC) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(78% 62% at 50% 26%, #000 0%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(78% 62% at 50% 26%, #000 0%, transparent 78%)',
        }}
      />

      {/* 3 · Grano */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
