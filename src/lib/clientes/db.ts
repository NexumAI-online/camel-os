import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Cliente, ClienteOpcion } from './types';

/** ¿El error es porque la tabla `clientes` todavía no existe (falta el SQL)? */
function tablaFalta(msg?: string): boolean {
  return !!msg && /clientes.*does not exist|relation .*clientes|schema cache/i.test(msg);
}

/** Lista clientes, opcionalmente filtrados por texto (nombre/CIF/email). */
export async function listarClientes(busqueda?: string): Promise<Cliente[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from('clientes').select('*').order('creada_en', { ascending: false });

  const b = busqueda?.trim();
  if (b) {
    const seguro = b.replace(/[(),]/g, ' ').trim();
    if (seguro) {
      q = q.or(`nombre.ilike.%${seguro}%,cif.ilike.%${seguro}%,email.ilike.%${seguro}%`);
    }
  }

  const { data, error } = await q;
  if (error) {
    if (tablaFalta(error.message)) return []; // aún no se corrió clientes.sql
    throw new Error(error.message);
  }
  return (data ?? []) as Cliente[];
}

/** Obtiene un cliente por id, o null. */
export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Cliente) ?? null;
}

/** Opciones para selectores (factura / vehículo), ordenadas por nombre. */
export async function listarClientesOpciones(): Promise<ClienteOpcion[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('clientes')
    .select('id, tipo, nombre, cif, direccion')
    .order('nombre', { ascending: true });
  if (error) {
    if (tablaFalta(error.message)) return []; // aún no se corrió clientes.sql
    throw new Error(error.message);
  }
  return (data ?? []) as ClienteOpcion[];
}
