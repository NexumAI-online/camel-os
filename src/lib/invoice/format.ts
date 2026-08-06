import type { LineaFactura, Moneda } from './types';

/**
 * Formatea un importe al estilo del PDF de ECOM: separador de miles con punto,
 * decimales con coma (solo si los hay) y el código de moneda pegado.
 * Ej.: 16967 → "16.967AED" · 1234.5 → "1.234,50AED".
 */
export function formatearImporte(valor: number, moneda: Moneda): string {
  const n = Number.isFinite(valor) ? valor : 0;
  const tieneDecimales = Math.round(n * 100) % 100 !== 0;
  const numero = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: tieneDecimales ? 2 : 0,
    maximumFractionDigits: 2,
    // El español no agrupa números de 4 dígitos (6428), pero el PDF de ECOM
    // sí usa el punto de millar siempre → 6.428. Forzamos la agrupación.
    useGrouping: 'always',
  }).format(n);
  return `${numero}${moneda}`;
}

/** Suma de las cantidades de todas las líneas. */
export function totalFactura(lineas: LineaFactura[]): number {
  return lineas.reduce((acc, l) => acc + (Number.isFinite(l.cantidad) ? l.cantidad : 0), 0);
}
