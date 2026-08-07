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
  ubicacion: string | null;
  url: string | null;
  imagen_url: string | null;
  vendedor: string | null;
  descartado: boolean;
  encontrado_en: string;
}

/** Filtros del tablero. */
export interface FiltrosBuscador {
  q?: string;
  portal?: string;
  precioMax?: number;
  anioMin?: number;
}
