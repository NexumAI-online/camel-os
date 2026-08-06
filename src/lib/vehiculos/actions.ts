'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ESTADOS } from './types';

/** Extrae y normaliza los campos del formulario de vehículo. */
function parseForm(formData: FormData) {
  const s = (k: string) => {
    const v = formData.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };
  const entero = (k: string) => {
    const v = s(k);
    if (v === '') return null;
    const n = parseInt(v.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  const decimal = (k: string) => {
    const v = s(k).replace(/\./g, '').replace(',', '.');
    if (v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const estado = s('estado');

  return {
    marca: s('marca'),
    modelo: s('modelo'),
    anio: entero('anio'),
    km: entero('km'),
    bastidor: s('bastidor') || null,
    mulquilla: s('mulquilla') || null,
    color: s('color') || null,
    precio_compra: decimal('precio_compra'),
    estado: ESTADOS.some((e) => e.value === estado) ? estado : 'en_dubai',
    notas: s('notas') || null,
  };
}

export async function crearVehiculo(formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.marca || !datos.modelo) {
    throw new Error('Marca y modelo son obligatorios.');
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('vehiculos').insert(datos);
  if (error) throw new Error(error.message);

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}

export async function actualizarVehiculo(id: string, formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.marca || !datos.modelo) {
    throw new Error('Marca y modelo son obligatorios.');
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('vehiculos').update(datos).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/vehiculos');
  revalidatePath(`/vehiculos/${id}`);
  redirect('/vehiculos');
}

export async function eliminarVehiculo(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('vehiculos').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}
