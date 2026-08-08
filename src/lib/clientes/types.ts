/** Modelo de datos de clientes de Camel (Feature 4). */

export const TIPOS_CLIENTE = [
  { value: 'business', label: 'Empresa' },
  { value: 'particular', label: 'Particular' },
] as const;

export type TipoCliente = (typeof TIPOS_CLIENTE)[number]['value'];

export function etiquetaTipoCliente(tipo: string): string {
  return TIPOS_CLIENTE.find((t) => t.value === tipo)?.label ?? tipo;
}

export interface Cliente {
  id: string;
  tipo: TipoCliente;
  nombre: string;
  /** CIF / NIF / Tax ID. */
  cif: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  creada_en: string;
  actualizada_en: string;
}

/** Versión reducida para selectores (autocompletar factura / asociar vehículo). */
export interface ClienteOpcion {
  id: string;
  tipo: TipoCliente;
  nombre: string;
  cif: string | null;
  direccion: string | null;
}
