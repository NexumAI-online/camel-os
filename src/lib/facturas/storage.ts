import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';

/** Bucket PRIVADO de Supabase Storage donde viven los PDF de las facturas. */
export const BUCKET_FACTURAS = 'facturas';

/**
 * Sube el PDF de una factura al bucket privado y devuelve su `path` (que se
 * guarda en la fila de la factura como referencia). El nombre incluye el número
 * de factura para reconocerlo, más un UUID para no pisar versiones.
 */
export async function subirPdfFactura(pdf: Uint8Array, numero: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const num = (numero || 's-n').replace(/[^A-Za-z0-9]+/g, '') || 's-n';
  const path = `${num}-${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage.from(BUCKET_FACTURAS).upload(path, Buffer.from(pdf), {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw new Error(`Storage upload factura: ${error.message}`);
  return path;
}

/** Descarga el PDF (bytes) de una factura desde el bucket privado. */
export async function descargarPdfFactura(path: string): Promise<Uint8Array> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(BUCKET_FACTURAS).download(path);
  if (error || !data) throw new Error(`Storage download factura: ${error?.message ?? 'sin datos'}`);
  return new Uint8Array(await data.arrayBuffer());
}

/** Borra el PDF de una factura (best-effort, para no dejar huérfanos al re-generar). */
export async function borrarPdfFactura(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(BUCKET_FACTURAS).remove([path]);
}
