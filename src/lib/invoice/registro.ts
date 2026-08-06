import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { totalFactura } from './format';
import type { Factura } from './types';

/**
 * Registra una factura generada en Supabase (índice + link al PDF de Drive).
 * El archivo PDF vive en Drive; acá guardamos los datos consultables.
 */
export async function registrarFactura(
  factura: Factura,
  driveUrl: string | null,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('facturas').insert({
    numero: factura.numero,
    tipo: factura.tipo,
    idioma: factura.idioma,
    moneda: factura.moneda,
    fecha: factura.fecha,
    cliente_nombre: factura.cliente.nombre,
    cliente_identificacion: factura.cliente.identificacion,
    total: totalFactura(factura.lineas),
    lineas: factura.lineas,
    drive_url: driveUrl,
  });
  if (error) {
    throw new Error(`Supabase insert: ${error.message}`);
  }
}
