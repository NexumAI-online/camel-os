import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Documento, Foto } from './types';

/** Bucket público de Supabase Storage donde viven las fotos de vehículos. */
export const BUCKET_VEHICULOS = 'vehiculos';

/** Bucket PRIVADO donde viven los documentos (papeles de propiedad, etc.). */
export const BUCKET_DOCUMENTOS = 'documentos';

/** Vigencia de las URLs firmadas de documentos (segundos). */
const FIRMA_TTL = 60 * 60; // 1 hora

/** Sube varios archivos al bucket bajo la carpeta del vehículo. Devuelve las fotos. */
export async function subirFotos(vehiculoId: string, archivos: File[]): Promise<Foto[]> {
  const supabase = getSupabaseAdmin();
  const fotos: Foto[] = [];

  for (const archivo of archivos) {
    if (!archivo || archivo.size === 0) continue;
    const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${vehiculoId}/${crypto.randomUUID()}.${ext || 'jpg'}`;
    const buffer = Buffer.from(await archivo.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET_VEHICULOS).upload(path, buffer, {
      contentType: archivo.type || 'image/jpeg',
      upsert: false,
    });
    if (error) throw new Error(`Storage upload: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET_VEHICULOS).getPublicUrl(path);
    fotos.push({ path, url: data.publicUrl });
  }

  return fotos;
}

/** Borra una foto del bucket (best-effort). */
export async function borrarFoto(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET_VEHICULOS).remove([path]);
  if (error) throw new Error(`Storage remove: ${error.message}`);
}

/** Sube varios documentos al bucket privado bajo la carpeta del vehículo. */
export async function subirDocumentos(
  vehiculoId: string,
  archivos: File[],
): Promise<Documento[]> {
  const supabase = getSupabaseAdmin();
  const docs: Documento[] = [];

  for (const archivo of archivos) {
    if (!archivo || archivo.size === 0) continue;
    const ext = (archivo.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${vehiculoId}/${crypto.randomUUID()}.${ext || 'bin'}`;
    const buffer = Buffer.from(await archivo.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET_DOCUMENTOS).upload(path, buffer, {
      contentType: archivo.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw new Error(`Storage upload doc: ${error.message}`);

    docs.push({ path, nombre: archivo.name, tipo: archivo.type || undefined });
  }

  return docs;
}

/** Borra un documento del bucket privado (best-effort). */
export async function borrarDocumento(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTOS).remove([path]);
  if (error) throw new Error(`Storage remove doc: ${error.message}`);
}

/**
 * Genera una URL firmada (temporal) para descargar/ver un documento privado.
 * Devuelve null si falla, para no romper el render de la página.
 */
export async function urlFirmadaDocumento(path: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(path, FIRMA_TTL);
  if (error || !data) return null;
  return data.signedUrl;
}
