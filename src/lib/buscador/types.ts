/** Modelo del buscador de unidades en portales de Dubái (Feature 3). */

export const PORTALES = [
  { value: 'dubizzle', label: 'Dubizzle' },
  { value: 'yallamotor', label: 'YallaMotor' },
  { value: 'dubicars', label: 'Dubicars' },
  { value: 'fb_marketplace', label: 'FB Marketplace' },
] as const;

export type Portal = (typeof PORTALES)[number]['value'];

export function etiquetaPortal(portal: string): string {
  return PORTALES.find((p) => p.value === portal)?.label ?? portal;
}

/** Un anuncio encontrado en un portal. */
export interface Resultado {
  id: string;
  portal: Portal;
  titulo: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  km: number | null;
  precio: number | null;
  moneda: string;
  specs: string | null;
  color: string | null;
  ubicacion: string | null;
  url: string | null;
  imagen_url: string | null;
  vendedor: string | null;
  descartado: boolean;
  encontrado_en: string;
}

/**
 * Filtros del tablero. Los rangos de precio ya vienen convertidos a AED
 * (la conversión de la moneda elegida se hace en la página).
 */
export interface FiltrosBuscador {
  q?: string;
  portales?: string[];
  specs?: string[];
  anioMin?: number;
  anioMax?: number;
  precioMinAed?: number;
  precioMaxAed?: number;
  kmMin?: number;
  kmMax?: number;
}

/**
 * Fila tal como la produce un scraper, antes de persistir.
 * (Sin id/descartado/encontrado_en, que los pone la base.)
 */
export interface ResultadoScrapeado {
  titulo: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  km: number | null;
  precio: number | null;
  moneda: string;
  specs: string | null;
  color: string | null;
  ubicacion: string | null;
  url: string | null;
  imagen_url: string | null;
  vendedor: string | null;
}

/** Resumen de una corrida de scraping+ingesta (para feedback en el tablero). */
export interface ResumenIngesta {
  encontrados: number;
  insertados: number;
  duplicados: number;
}
