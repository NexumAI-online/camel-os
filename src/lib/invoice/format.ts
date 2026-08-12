import type { Factura, LineaFactura, Moneda } from './types';

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

/**
 * Suma de las cantidades de todas las líneas. Es la BASE IMPONIBLE (antes de
 * IVA). Sin IVA, coincide con el total; con IVA, es el subtotal a desglosar.
 */
export function totalFactura(lineas: LineaFactura[]): number {
  return lineas.reduce((acc, l) => acc + (Number.isFinite(l.cantidad) ? l.cantidad : 0), 0);
}

/** ¿La factura desglosa IVA? (activo y con porcentaje > 0). */
export function llevaIva(factura: Factura): boolean {
  return !!factura.iva?.activo && (factura.iva.porcentaje ?? 0) > 0;
}

/** Importe del IVA sobre la base imponible (0 si la factura no lleva IVA). */
export function importeIva(factura: Factura): number {
  if (!llevaIva(factura)) return 0;
  return totalFactura(factura.lineas) * (factura.iva!.porcentaje / 100);
}

/** Total a pagar = base imponible + IVA. Sin IVA, es la base imponible. */
export function totalConIva(factura: Factura): number {
  return totalFactura(factura.lineas) + importeIva(factura);
}
