import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  descargarPdfDeDrive,
  driveConfigurada,
  driveFileId,
} from '@/lib/google/drive';

export const dynamic = 'force-dynamic';

/**
 * Descarga el PDF de una factura. Trae el archivo desde Drive con la OAuth del
 * servidor y lo devuelve con `Content-Disposition: attachment`, así el navegador
 * lo baja directo (sin abrir el visor de Drive ni depender del login del usuario).
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
  if (!data?.drive_url) return new Response('Esta factura no tiene PDF.', { status: 404 });
  if (!driveConfigurada()) return new Response('Drive no está configurado.', { status: 503 });

  const fileId = driveFileId(data.drive_url);
  if (!fileId) return new Response('No se pudo identificar el archivo.', { status: 404 });

  let pdf: Uint8Array;
  try {
    pdf = await descargarPdfDeDrive(fileId);
  } catch (e) {
    return new Response(`No se pudo descargar el PDF: ${(e as Error).message}`, { status: 502 });
  }

  const nombre = `Factura-${(data.numero || id).replace(/[^\w.-]+/g, '_')}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
    },
  });
}
