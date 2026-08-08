/** Specs y monedas del buscador (Feature 3). */

/** Máximo de resultados a traer por tienda en cada búsqueda (velocidad/costo). */
export const TOPE_POR_TIENDA = 300;

/** Opciones que el usuario puede elegir como máximo por tienda. */
export const TOPES = [50, 100, 200, 300, 500] as const;

/** Normaliza el máximo elegido a un valor válido (1–1000). */
export function topeValido(v: unknown): number {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  if (!Number.isFinite(n)) return TOPE_POR_TIENDA;
  return Math.min(Math.max(n, 1), 1000);
}

/** Origen/homologación de la unidad (specs). */
export const SPECS = [
  { value: 'gcc', label: 'GCC' },
  { value: 'american', label: 'Americana' },
  { value: 'canadian', label: 'Canadiense' },
  { value: 'european', label: 'Europea' },
  { value: 'japanese', label: 'Japonesa' },
  { value: 'korean', label: 'Coreana' },
  { value: 'chinese', label: 'China' },
  { value: 'other', label: 'Otra' },
] as const;

export type Spec = (typeof SPECS)[number]['value'];

export function etiquetaSpec(spec: string): string {
  return SPECS.find((s) => s.value === spec)?.label ?? spec;
}

/** Normaliza el texto de specs de cada portal al valor canónico. */
export function normalizarSpec(raw?: string | null): Spec | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('gcc')) return 'gcc';
  if (s.includes('americ')) return 'american';
  if (s.includes('canad')) return 'canadian';
  if (s.includes('europ')) return 'european';
  if (s.includes('japan') || s.includes('jdm')) return 'japanese';
  if (s.includes('korea')) return 'korean';
  if (s.includes('chin')) return 'chinese';
  return 'other';
}

/** Monedas seleccionables en el filtro de precio. */
export const MONEDAS = [
  { value: 'AED', label: 'AED (dírham)' },
  { value: 'USD', label: 'USD (dólar)' },
  { value: 'EUR', label: 'EUR (euro)' },
] as const;

export type Moneda = (typeof MONEDAS)[number]['value'];

/**
 * Cuántos AED vale 1 unidad de cada moneda.
 * AED/USD está clavado por el banco central (~3.6725). EUR es APROXIMADO
 * (fluctúa); se usa sólo para convertir el rango de precio del filtro a AED.
 * Actualizar acá si el euro se mueve mucho.
 */
export const TASAS_AED: Record<string, number> = {
  AED: 1,
  USD: 3.6725,
  EUR: 4.0,
};

/** Convierte un monto en la moneda dada a AED (para filtrar). */
export function aAed(monto: number, moneda: string): number {
  const tasa = TASAS_AED[moneda] ?? 1;
  return monto * tasa;
}
