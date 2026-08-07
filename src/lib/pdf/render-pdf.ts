import 'server-only';

import { abrirNavegador } from '@/lib/browser';

/**
 * Navega a una URL interna (la página que renderiza la factura) y la imprime a
 * PDF A4, fiel al PDF de ECOM (Nº0997).
 *
 * `page.pdf()` emula media `print` automáticamente, así que se aplican las reglas
 * `@media print` de globals.css: ocultan el chrome de la app y escalan `.print-area`
 * a A4 (transform: scale(1.3336)) — el mismo resultado que Ctrl+P en el navegador.
 * Por eso NO pasamos `scale` acá (lo hace el CSS).
 */

export async function urlToPdf(url: string): Promise<Uint8Array> {
  const navegador = await abrirNavegador();
  try {
    const pagina = await navegador.newPage();
    await pagina.goto(url, { waitUntil: 'networkidle0' });
    // Asegura que la webfont (Roboto) esté lista antes de imprimir.
    await pagina.evaluateHandle('document.fonts.ready');
    const pdf = await pagina.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return pdf;
  } finally {
    await navegador.close();
  }
}
