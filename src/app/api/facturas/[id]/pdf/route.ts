import { getSupabaseAdmin } from '@/lib/supabase/server';
import { descargarPdfFactura } from '@/lib/facturas/storage';
import { descargarPdfDeDrive, driveConfigurada, driveFileId } from '@/lib/google/drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Descarga el PDF de una factura con `Content-Disposition: attachment` (el
 * navegador lo baja directo). La referencia guardada en la fila puede ser:
 *   · un `path` de Supabase Storage (facturas nuevas) → se baja de Storage.
 *   · una URL http de Google Drive (facturas legacy)  → se baja de Drive.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('facturas')
    .select('numero, drive_url')
    .eq('id', id)
    .maybeSingle();

  if (error) return new Response(error.message, { status: 500 });
  const ref = data?.drive_url as string | null;
  if (!ref) return new Response('Esta factura no tiene PDF.', { status: 404 });

  let pdf: Uint8Array;
  try {
    if (/^https?:/i.test(ref)) {
      // Legacy: PDF en Google Drive.
      if (!driveConfigurada()) return new Response('Drive no está configurado.', { status: 503 });
      const fileId = driveFileId(ref);
      if (!fileId) return new Response('No se pudo identificar el archivo.', { status: 404 });
      pdf = await descargarPdfDeDrive(fileId);
    } else {
      // PDF en Supabase Storage.
      pdf = await descargarPdfFactura(ref);
    }
  } catch (e) {
    return new Response(`No se pudo descargar el PDF: ${(e as Error).message}`, { status: 502 });
  }

  const nombre = `Factura-${(data?.numero || id).replace(/[^\w.-]+/g, '_')}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
    },
  });
}
