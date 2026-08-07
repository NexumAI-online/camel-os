'use server';

import { revalidatePath } from 'next/cache';

import { getSupabaseAdmin } from '@/lib/supabase/server';

/** Descarta un resultado (Carlos lo marca como no interesante → se oculta). */
export async function descartarResultado(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('busqueda_resultados')
    .update({ descartado: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/buscador');
}
