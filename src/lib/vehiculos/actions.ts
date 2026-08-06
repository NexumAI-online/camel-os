'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ESTADOS, type Foto } from './types';
import { borrarFoto, subirFotos } from './storage';

/** Archivos de imagen seleccionados en el formulario (input name="fotos"). */
function archivosDe(formData: FormData): File[] {
  return formData
    .getAll('fotos')
    .filter((f): f is File => f instanceof File && f.size > 0);
}

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
  const { data, error } = await supabase.from('vehiculos').insert(datos).select('id').single();
  if (error) throw new Error(error.message);

  // Sube las fotos (si hay) a la carpeta del vehículo recién creado.
  const archivos = archivosDe(formData);
  if (archivos.length) {
    const fotos = await subirFotos(data.id, archivos);
    await supabase.from('vehiculos').update({ fotos }).eq('id', data.id);
  }

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}

export async function actualizarVehiculo(id: string, formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.marca || !datos.modelo) {
    throw new Error('Marca y modelo son obligatorios.');
  }
  const supabase = getSupabaseAdmin();

  // Fotos nuevas se agregan a las existentes (no reemplazan).
  const archivos = archivosDe(formData);
  const payload: Record<string, unknown> = { ...datos };
  if (archivos.length) {
    const nuevas = await subirFotos(id, archivos);
    const { data: actual } = await supabase.from('vehiculos').select('fotos').eq('id', id).single();
    const existentes: Foto[] = Array.isArray(actual?.fotos) ? (actual!.fotos as Foto[]) : [];
    payload.fotos = [...existentes, ...nuevas];
  }

  const { error } = await supabase.from('vehiculos').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/vehiculos');
  revalidatePath(`/vehiculos/${id}`);
  redirect('/vehiculos');
}

/** Borra una foto puntual de un vehículo (del storage y del registro). */
export async function eliminarFotoVehiculo(id: string, path: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('vehiculos').select('fotos').eq('id', id).single();
  const fotos: Foto[] = Array.isArray(data?.fotos) ? (data!.fotos as Foto[]) : [];
  const restantes = fotos.filter((f) => f.path !== path);

  const { error } = await supabase.from('vehiculos').update({ fotos: restantes }).eq('id', id);
  if (error) throw new Error(error.message);
  try {
    await borrarFoto(path);
  } catch {
    /* si falla el borrado físico, al menos ya no figura en el registro */
  }

  revalidatePath(`/vehiculos/${id}`);
  revalidatePath('/vehiculos');
}

export async function eliminarVehiculo(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('vehiculos').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}
