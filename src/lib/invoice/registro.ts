import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { totalFactura } from './format';
import type { Factura } from './types';

/**
 * Registro de facturas en Supabase (índice + link al PDF de Drive). El archivo
 * PDF vive en Drive; acá guardamos los datos consultables y editables.
 *
 * `cliente_direccion` es opcional a nivel esquema: si la columna todavía no
 * existe (ALTER pendiente), el guardado igual funciona sin ella (la dirección
 * no persiste hasta correr el ALTER). Así nada se rompe por el orden de setup.
 */

function fila(factura: Factura, driveUrl: string | null) {
  return {
    numero: factura.numero,
    tipo: factura.tipo,
    idioma: factura.idioma,
    moneda: factura.moneda,
    fecha: factura.fecha,
    cliente_nombre: factura.cliente.nombre,
    cliente_identificacion: factura.cliente.identificacion,
    cliente_direccion: factura.cliente.direccion,
    total: totalFactura(factura.lineas),
    lineas: factura.lineas,
    drive_url: driveUrl,
  };
}

function faltaColumnaDireccion(msg: string): boolean {
  return /cliente_direccion/.test(msg);
}

/** Inserta una factura nueva. Devuelve su id (o null si no se pudo leer). */
export async function registrarFactura(
  factura: Factura,
  driveUrl: string | null,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const f = fila(factura, driveUrl);

  let res = await supabase.from('facturas').insert(f).select('id').maybeSingle();
  if (res.error && faltaColumnaDireccion(res.error.message)) {
    const { cliente_direccion: _omit, ...sinDireccion } = f;
    res = await supabase.from('facturas').insert(sinDireccion).select('id').maybeSingle();
  }
  if (res.error) throw new Error(`Supabase insert: ${res.error.message}`);
  return (res.data as { id: string } | null)?.id ?? null;
}

/** Actualiza una factura existente (edición + regeneración del PDF). */
export async function actualizarRegistroFactura(
  id: string,
  factura: Factura,
  driveUrl: string | null,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const f = fila(factura, driveUrl);

  let res = await supabase.from('facturas').update(f).eq('id', id);
  if (res.error && faltaColumnaDireccion(res.error.message)) {
    const { cliente_direccion: _omit, ...sinDireccion } = f;
    res = await supabase.from('facturas').update(sinDireccion).eq('id', id);
  }
  if (res.error) throw new Error(`Supabase update: ${res.error.message}`);
}
