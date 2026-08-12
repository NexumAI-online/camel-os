/** Modelo de datos de la factura de Camel / ECOM HOLDING. */

export type TipoFactura = 'venta' | 'gasto';
export type Idioma = 'es' | 'en';
export type Moneda = 'AED' | 'EUR' | 'USD';

/** Una línea de la tabla de artículos/servicios. */
export interface LineaFactura {
  /** id local para keys y edición (no viaja a la plantilla). */
  id: string;
  /** Concepto principal, columna DESCRIPCIÓN (se imprime en negrita). El VIN puede ir aquí. */
  descripcion: string;
  /** Columna DETALLES (ej. "Dubai - Spain"). */
  detalles: string;
  /** Texto descriptivo adicional que se imprime bajo la descripción (multilínea). Opcional. */
  notaAdicional?: string;
  /** Importe en la moneda de la factura. */
  cantidad: number;
}

/**
 * Configuración de IVA de la factura (opcional).
 * Si el bloque no existe o `activo` es false, la factura NO desglosa impuestos
 * y se comporta exactamente igual que antes (sin línea de IVA en el PDF).
 */
export interface Iva {
  activo: boolean;
  /** Porcentaje aplicado sobre la base imponible (ej. 21 = 21%). */
  porcentaje: number;
}

/** Datos del comprador (bloque "Factura a:"). */
export interface Cliente {
  nombre: string;
  /** CIF / NIF / Tax ID. */
  identificacion: string;
  /** Dirección multilínea (una línea por salto). */
  direccion: string;
}

/** Documento de factura completo. */
export interface Factura {
  tipo: TipoFactura;
  idioma: Idioma;
  moneda: Moneda;
  /** Número de factura (ej. "0997"). */
  numero: string;
  /** Fecha en formato dd/mm/aaaa. */
  fecha: string;
  cliente: Cliente;
  lineas: LineaFactura[];
  /** IVA de la factura (opcional). Ausente = sin IVA (comportamiento previo). */
  iva?: Iva;
}
