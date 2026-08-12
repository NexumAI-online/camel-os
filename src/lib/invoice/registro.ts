import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { totalConIva } from './format';
import type { Factura } from './types';

/**
 * Registro de facturas en Supabase (índice + datos + referencia al PDF).
 * El PDF vive en Supabase Storage (bucket `facturas`); la columna `drive_url`
 * guarda su `path` de Storage. (Se mantiene el nombre de columna por compat;
 * valores viejos con http:// son PDFs legacy en Google Drive.)
 *
 * Algunas columnas son opcionales a nivel esquema (`cliente_direccion`,
 * `lleva_iva`, `iva_porcentaje`): si todavía no existen (ALTER pendiente), el
 * guardado igual funciona sin ellas (esos datos no persisten hasta correr el
 * ALTER). Así nada se rompe por el orden de setup.
 *
 * `total` se guarda YA CON IVA (base + IVA) para que el listado muestre el
 * importe final; sin IVA coincide con la base imponible (sin cambios).
 */

/** Columnas que pueden no existir aún en el esquema (degradación elegante). */
const COLUMNAS_OPCIONALES = ['cliente_direccion', 'lleva_iva', 'iva_porcentaje'] as const;

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
    lleva_iva: !!factura.iva?.activo && (factura.iva.porcentaje ?? 0) > 0,
    iva_porcentaje: factura.iva?.activo ? (factura.iva.porcentaje ?? 0) : 0,
    total: totalConIva(factura),
    lineas: factura.lineas,
    drive_url: pdfRef,
  };
}

/** Nombre de la columna opcional que falta según el mensaje de error, o null. */
function columnaOpcionalFaltante(msg: string): string | null {
  return COLUMNAS_OPCIONALES.find((c) => msg.includes(c)) ?? null;
}

/** Quita del payload todas las columnas opcionales (para reintentar sin ellas). */
function sinColumnasOpcionales(f: ReturnType<typeof fila>) {
  const copia: Record<string, unknown> = { ...f };
  for (const c of COLUMNAS_OPCIONALES) delete copia[c];
  return copia;
}

/** Referencia actual del PDF de una factura (path de Storage o URL legacy). */
export async function refPdfFactura(id: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('facturas').select('drive_url').eq('id', id).maybeSingle();
  return (data?.drive_url as string | null) ?? null;
}

/** Inserta una factura nueva. Devuelve su id (o null si no se pudo leer). */
export async function registrarFactura(
  factura: Factura,
  pdfRef: string | null,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const f = fila(factura, pdfRef);

  let res = await supabase.from('facturas').insert(f).select('id').maybeSingle();
  if (res.error && columnaOpcionalFaltante(res.error.message)) {
    res = await supabase
      .from('facturas')
      .insert(sinColumnasOpcionales(f))
      .select('id')
      .maybeSingle();
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
  if (res.error && columnaOpcionalFaltante(res.error.message)) {
    res = await supabase.from('facturas').update(sinColumnasOpcionales(f)).eq('id', id);
  }
  if (res.error) throw new Error(`Supabase update: ${res.error.message}`);
}
