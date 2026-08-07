import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { totalFactura } from './format';
import type { Factura } from './types';

/**
 * Registro de facturas en Supabase (índice + datos + referencia al PDF).
 * El PDF vive en Supabase Storage (bucket `facturas`); la columna `drive_url`
 * guarda su `path` de Storage. (Se mantiene el nombre de columna por compat;
 * valores viejos con http:// son PDFs legacy en Google Drive.)
 *
 * `cliente_direccion` es opcional a nivel esquema: si la columna todavía no
 * existe (ALTER pendiente), el guardado igual funciona sin ella (la dirección
 * no persiste hasta correr el ALTER). Así nada se rompe por el orden de setup.
 */

function fila(factura: Factura, pdfRef: string | null) {
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
    drive_url: pdfRef,
  };
}

/** Referencia actual del PDF de una factura (path de Storage o URL legacy). */
export async function refPdfFactura(id: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('facturas').select('drive_url').eq('id', id).maybeSingle();
  return (data?.drive_url as string | null) ?? null;
}

function faltaColumnaDireccion(msg: string): boolean {
  return /cliente_direccion/.test(msg);
}

/** Inserta una factura nueva. Devuelve su id (o null si no se pudo leer). */
export async function registrarFactura(
  factura: Factura,
  pdfRef: string | null,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const f = fila(factura, pdfRef);

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
  pdfRef: string | null,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const f = fila(factura, pdfRef);

  let res = await supabase.from('facturas').update(f).eq('id', id);
  if (res.error && faltaColumnaDireccion(res.error.message)) {
    const { cliente_direccion: _omit, ...sinDireccion } = f;
    res = await supabase.from('facturas').update(sinDireccion).eq('id', id);
  }
  if (res.error) throw new Error(`Supabase update: ${res.error.message}`);
}
