import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Foto } from './types';

/** Bucket público de Supabase Storage donde viven las fotos de vehículos. */
export const BUCKET_VEHICULOS = 'vehiculos';

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
