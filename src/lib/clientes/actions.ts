'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { TIPOS_CLIENTE } from './types';

function parseForm(formData: FormData) {
  const s = (k: string) => {
    const v = formData.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };
  const tipo = s('tipo');
  return {
    tipo: TIPOS_CLIENTE.some((t) => t.value === tipo) ? tipo : 'business',
    nombre: s('nombre'),
    cif: s('cif') || null,
    direccion: s('direccion') || null,
    email: s('email') || null,
    telefono: s('telefono') || null,
    notas: s('notas') || null,
  };
}

export async function crearCliente(formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.nombre) throw new Error('El nombre es obligatorio.');
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('clientes').insert(datos);
  if (error) throw new Error(error.message);
  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function actualizarCliente(id: string, formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.nombre) throw new Error('El nombre es obligatorio.');
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('clientes').update(datos).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clientes');
  revalidatePath(`/clientes/${id}`);
  redirect('/clientes');
}

export async function eliminarCliente(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clientes');
  redirect('/clientes');
}

/** Borra varios clientes a la vez (selección múltiple en el listado). */
export async function eliminarClientes(ids: string[]) {
  const limpio = ids.filter(Boolean);
  if (limpio.length === 0) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('clientes').delete().in('id', limpio);
  if (error) throw new Error(error.message);
  revalidatePath('/clientes');
}
