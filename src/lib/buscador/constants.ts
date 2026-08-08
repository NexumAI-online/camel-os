/** Specs y monedas del buscador (Feature 3). */

/**
 * Cuántos coches se muestran de entrada en el tablero, y cuántos añade cada
 * pulsación de "Cargar más". La carga es sobre lo YA guardado (instantánea):
 * el escaneo de fondo va llenando la base y esto solo controla cuántos se ven.
 */
export const POR_PAGINA = 100;
export const INCREMENTO = 50;

/**
 * El escaneo de Dubicars va hasta AGOTAR la marca (se detiene solo cuando el
 * portal devuelve una página vacía) → trae TODAS las coincidencias, pase lo que
 * pase. Esto es solo un techo de seguridad para no entrar en bucle en un caso
 * patológico: 200 páginas ≈ 6.000 coches, muy por encima de cualquier marca real
 * (Mercedes ~1.900 = ~63 págs). Si alguna vez se toca, el chip lo avisa.
 */
export const MAX_PAGINAS_DUBICARS = 200;

/**
 * Máximo de filas que el tablero manda al cliente para paginar ("Cargar más").
 * Alto para que una búsqueda filtrada (p. ej. "BMW americana") las muestre TODAS;
 * el escaneo guarda solo lo que coincide, así que en la práctica no se acerca.
 */
export const LIMITE_TABLERO = 2000;

/** Coches por corrida de Apify (YallaMotor/Dubizzle): fijo, ya no lo elige el usuario. */
export const TOPE_APIFY = 100;

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
