import { InvoicePreview } from '@/components/facturacion/invoice-preview';
import { decodeFacturaParam } from '@/lib/invoice/render-url';

/**
 * Página interna de render para el motor PDF. NO es de uso directo: el endpoint
 * /api/facturas/generar la navega con Puppeteer y la imprime a PDF. Al imprimir,
 * las reglas `@media print` de globals.css ocultan el chrome de la app y dejan
 * solo `.print-area` (el documento), escalado a A4 — idéntico a Ctrl+P.
 *
 * Los datos llegan como JSON base64url en `?d=`; no se persiste nada.
 */
export const dynamic = 'force-dynamic';

export default async function RenderFacturaPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const factura = decodeFacturaParam(d);

  if (!factura) {
    return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Sin datos de factura.</div>;
  }

  return <InvoicePreview factura={factura} />;
}
