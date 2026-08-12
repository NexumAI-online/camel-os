import type { Idioma } from './types';

/**
 * Datos fijos del emisor (ECOM HOLDING) y textos legales de la factura.
 * Fuente: reunión Camel + PDF de ejemplo (Factura Nº0997).
 * Los textos en EN son provisionales para el preview; el texto definitivo
 * vive en las plantillas Google Docs que aportará Carlos.
 */

export const EMISOR = {
  nombre: 'ECOM HOLDING LLC FZ',
  direccion: [
    'Meydan Grandstand 6th floor Meydan Road',
    'Nad Al Sheba, Dubái, Emiratos Árabes Unidos',
  ],
  tradeLicense: '2312151.01',
  beneficiario: 'Ecom Holding LLC',
  swift: 'MEBLAEADXXX',
  iban: 'AE020340003708515994301',
  bancoDireccion:
    'Meydan Grandstand 6th floor Meydan Road, Nad Al Sheba, Dubái, Emiratos Árabes Unidos',
} as const;

/** Ruta por defecto en la columna "detalles" de la línea de flete. */
export const RUTA_DEFECTO = 'Dubai - Spain';

/** Etiquetas y textos fijos, por idioma. */
export const TEXTOS: Record<
  Idioma,
  {
    titulo: string;
    fecha: string;
    facturaA: string;
    numeroFactura: string;
    seccionArticulos: string;
    colDescripcion: string;
    colDetalles: string;
    colCantidad: (moneda: string) => string;
    subtotal: string;
    iva: (porcentaje: number) => string;
    total: string;
    tradeLicense: string;
    terminosTitulo: string;
    terminos: string[];
    beneficiario: string;
    swift: string;
    iban: string;
    notasTitulo: string;
    notas: string[];
  }
> = {
  es: {
    titulo: 'Factura',
    fecha: 'Fecha',
    facturaA: 'Factura a:',
    numeroFactura: 'Número de factura:',
    seccionArticulos: 'DESCRIPCIÓN DE LOS ARTÍCULOS/SERVICIOS',
    colDescripcion: 'DESCRIPCION',
    colDetalles: 'DETALLES',
    colCantidad: (m) => `CANTIDAD (${m}):`,
    subtotal: 'Base imponible:',
    iva: (p) => `IVA (${p}%):`,
    total: 'Total:',
    tradeLicense: 'Trade License',
    terminosTitulo: 'Términos de pago:',
    terminos: [
      'El pago deberá efectuarse al recibir la mercancía, salvo que se acuerde lo contrario.',
      'El cliente abonará el importe total en AED mediante transferencia bancaria.',
    ],
    beneficiario: 'Beneficiario',
    swift: 'Swift/BIC Code',
    iban: 'IBAN',
    notasTitulo: 'Notas:',
    notas: [
      'Esta factura incluye la compra del vehículo, así como todos los gastos relacionados,',
      'reparaciones y modificaciones realizadas antes de la entrega.',
    ],
  },
  en: {
    titulo: 'Invoice',
    fecha: 'Date',
    facturaA: 'Bill to:',
    numeroFactura: 'Invoice number:',
    seccionArticulos: 'DESCRIPTION OF ITEMS/SERVICES',
    colDescripcion: 'DESCRIPTION',
    colDetalles: 'DETAILS',
    colCantidad: (m) => `AMOUNT (${m}):`,
    subtotal: 'Subtotal:',
    iva: (p) => `VAT (${p}%):`,
    total: 'Total:',
    tradeLicense: 'Trade License',
    terminosTitulo: 'Payment terms:',
    terminos: [
      'Payment shall be made upon receipt of the goods, unless otherwise agreed.',
      'The client shall pay the total amount in AED by bank transfer.',
    ],
    beneficiario: 'Beneficiary',
    swift: 'Swift/BIC Code',
    iban: 'IBAN',
    notasTitulo: 'Notes:',
    notas: [
      'This invoice includes the purchase of the vehicle, as well as all related costs,',
      'repairs and modifications carried out before delivery.',
    ],
  },
};
