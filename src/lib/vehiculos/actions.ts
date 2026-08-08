'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ESTADOS, type Documento, type Foto } from './types';
import {
  borrarDocumento,
  borrarFoto,
  subirDocumentos,
  subirFotos,
} from './storage';

/** Archivos de imagen seleccionados en el formulario (input name="fotos"). */
function archivosDe(formData: FormData): File[] {
  return formData
    .getAll('fotos')
    .filter((f): f is File => f instanceof File && f.size > 0);
}

/** Documentos seleccionados en el formulario (input name="documentos"). */
function documentosDe(formData: FormData): File[] {
  return formData
    .getAll('documentos')
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
    // El checkbox manda un valor sólo si está tildado.
    mulquilla: formData.get('mulquilla') != null,
    color: s('color') || null,
    precio_compra: decimal('precio_compra'),
    estado: ESTADOS.some((e) => e.value === estado) ? estado : 'en_dubai',
    notas: s('notas') || null,
    cliente_id: s('cliente_id') || null,
  };
}

/** ¿El error es por la columna cliente_id todavía inexistente (ALTER pendiente)? */
function faltaColumnaCliente(msg: string): boolean {
  return /cliente_id/.test(msg);
}

export async function crearVehiculo(formData: FormData) {
  const datos = parseForm(formData);
  if (!datos.marca || !datos.modelo) {
    throw new Error('Marca y modelo son obligatorios.');
  }
  const supabase = getSupabaseAdmin();
  let res = await supabase.from('vehiculos').insert(datos).select('id').single();
  if (res.error && faltaColumnaCliente(res.error.message)) {
    const { cliente_id: _omit, ...sinCliente } = datos;
    res = await supabase.from('vehiculos').insert(sinCliente).select('id').single();
  }
  if (res.error) throw new Error(res.error.message);
  const data = res.data;

  // Sube fotos y documentos (si hay) a la carpeta del vehículo recién creado.
  const archivos = archivosDe(formData);
  const docs = documentosDe(formData);
  const patch: Record<string, unknown> = {};
  if (archivos.length) patch.fotos = await subirFotos(data.id, archivos);
  if (docs.length) patch.documentos = await subirDocumentos(data.id, docs);
  if (Object.keys(patch).length) {
    await supabase.from('vehiculos').update(patch).eq('id', data.id);
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

  // Fotos y documentos nuevos se agregan a los existentes (no reemplazan).
  const archivos = archivosDe(formData);
  const docs = documentosDe(formData);
  const payload: Record<string, unknown> = { ...datos };

  if (archivos.length || docs.length) {
    const { data: actual } = await supabase
      .from('vehiculos')
      .select('fotos, documentos')
      .eq('id', id)
      .single();

    if (archivos.length) {
      const nuevas = await subirFotos(id, archivos);
      const existentes: Foto[] = Array.isArray(actual?.fotos) ? (actual!.fotos as Foto[]) : [];
      payload.fotos = [...existentes, ...nuevas];
    }
    if (docs.length) {
      const nuevos = await subirDocumentos(id, docs);
      const existentes: Documento[] = Array.isArray(actual?.documentos)
        ? (actual!.documentos as Documento[])
        : [];
      payload.documentos = [...existentes, ...nuevos];
    }
  }

  let res = await supabase.from('vehiculos').update(payload).eq('id', id);
  if (res.error && faltaColumnaCliente(res.error.message)) {
    const { cliente_id: _omit, ...sinCliente } = payload;
    res = await supabase.from('vehiculos').update(sinCliente).eq('id', id);
  }
  if (res.error) throw new Error(res.error.message);

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

/** Borra un documento puntual de un vehículo (del storage y del registro). */
export async function eliminarDocumentoVehiculo(id: string, path: string) {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('vehiculos').select('documentos').eq('id', id).single();
  const docs: Documento[] = Array.isArray(data?.documentos) ? (data!.documentos as Documento[]) : [];
  const restantes = docs.filter((d) => d.path !== path);

  const { error } = await supabase.from('vehiculos').update({ documentos: restantes }).eq('id', id);
  if (error) throw new Error(error.message);
  try {
    await borrarDocumento(path);
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
