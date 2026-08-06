import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Factura } from '@/lib/invoice/types';

/** Fila resumida para el listado de facturas. */
export interface FacturaResumen {
  id: string;
  numero: string;
  fecha: string | null;
  cliente_nombre: string | null;
  moneda: string;
  total: number;
  drive_url: string | null;
  creada_en: string;
}

export async function listarFacturas(): Promise<FacturaResumen[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('facturas')
    .select('id, numero, fecha, cliente_nombre, moneda, total, drive_url, creada_en')
    .order('creada_en', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FacturaResumen[];
}

export interface FacturaEditable {
  id: string;
  factura: Factura;
  driveUrl: string | null;
}

/** Trae una factura y la reconstruye como objeto `Factura` para editarla. */
export async function obtenerFactura(id: string): Promise<FacturaEditable | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('facturas').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const factura: Factura = {
    tipo: data.tipo,
    idioma: data.idioma,
    moneda: data.moneda,
    numero: data.numero,
    fecha: data.fecha ?? '',
    cliente: {
      nombre: data.cliente_nombre ?? '',
      identificacion: data.cliente_identificacion ?? '',
      // Si la columna no existe (ALTER pendiente), viene undefined → ''.
      direccion: data.cliente_direccion ?? '',
    },
    lineas: Array.isArray(data.lineas) ? data.lineas : [],
  };

  return { id: data.id, factura, driveUrl: data.drive_url ?? null };
}
