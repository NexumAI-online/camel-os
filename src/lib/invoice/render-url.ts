import type { Factura } from './types';

/**
 * Ruta interna que renderiza la factura como página HTML (la SSR nativa de Next),
 * para que el motor headless la navegue e imprima a PDF. Los datos viajan en la
 * query como JSON base64url (payload chico: unos pocos KB).
 */
export function facturaRenderPath(factura: Factura): string {
  const d = Buffer.from(JSON.stringify(factura), 'utf8').toString('base64url');
  return `/factura/render?d=${d}`;
}

/** Decodifica el parámetro `d` de la ruta de render. Devuelve null si es inválido. */
export function decodeFacturaParam(d: string | undefined): Factura | null {
  if (!d) return null;
  try {
    return JSON.parse(Buffer.from(d, 'base64url').toString('utf8')) as Factura;
  } catch {
    return null;
  }
}
