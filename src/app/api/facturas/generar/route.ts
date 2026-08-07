import { NextResponse } from 'next/server';

import type { Factura } from '@/lib/invoice/types';
import { facturaRenderPath } from '@/lib/invoice/render-url';
import { urlToPdf } from '@/lib/pdf/render-pdf';
import {
  actualizarRegistroFactura,
  refPdfFactura,
  registrarFactura,
} from '@/lib/invoice/registro';
import { borrarPdfFactura, subirPdfFactura } from '@/lib/facturas/storage';
import { supabaseConfigurada } from '@/lib/supabase/server';

/**
 * Motor de generación de facturas (Feature 1) · arquitectura "Opción A".
 *
 * Flujo:
 *   1. Validar los datos de la factura.
 *   2. Renderizar el layout `InvoicePreview` a HTML y de ahí a PDF A4 (Chromium).
 *   3. Si Supabase está configurado → subir el PDF a Storage y registrar la
 *      factura (índice + referencia al PDF). Todo vive en Supabase (no Drive).
 *   4. Devolver el PDF en base64 para descarga inmediata + estado de cada paso.
 *
 * El PDF se genera SIEMPRE (no depende de credenciales). Supabase es la capa
 * de persistencia; se activa al cargar SUPABASE_URL + service role key.
 */

// Chromium necesita el runtime Node (no Edge) y algo de holgura de tiempo.
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Origen (protocolo+host) desde el que llegó la petición, para que Puppeteer
 *  navegue a la propia app. Prioriza los headers forwarded (Vercel/proxy). */
function origenDeLaPeticion(req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto =
    req.headers.get('x-forwarded-proto') ??
    (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https');
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function nombreArchivo(f: Factura): string {
  const cliente = (f.cliente.nombre || 'cliente')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const num = (f.numero || 's-n').replace(/[^A-Za-z0-9]+/g, '');
  return `Factura-${num}-${cliente}.pdf`;
}

export async function POST(req: Request) {
  let factura: Factura;
  let facturaId: string | null = null;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    // `facturaId` (opcional) indica edición → se actualiza en vez de insertar.
    facturaId = typeof body?.facturaId === 'string' ? body.facturaId : null;
    const { facturaId: _omit, ...resto } = body ?? {};
    factura = resto as unknown as Factura;
  } catch {
    return NextResponse.json(
      { ok: false, motivo: 'Cuerpo de la petición inválido.' },
      { status: 400 },
    );
  }

  // Validación mínima de datos.
  if (!factura?.numero?.trim()) {
    return NextResponse.json(
      { ok: false, motivo: 'Falta el número de factura.' },
      { status: 422 },
    );
  }
  if (!factura?.cliente?.nombre?.trim()) {
    return NextResponse.json(
      { ok: false, motivo: 'Falta el nombre del cliente.' },
      { status: 422 },
    );
  }
  if (!factura?.lineas?.some((l) => l.descripcion.trim())) {
    return NextResponse.json(
      { ok: false, motivo: 'Añadí al menos un concepto con descripción.' },
      { status: 422 },
    );
  }

  // 1-2. Render → PDF (siempre). Puppeteer navega a la página interna de render.
  let pdf: Uint8Array;
  try {
    const origin = origenDeLaPeticion(req);
    pdf = await urlToPdf(`${origin}${facturaRenderPath(factura)}`);
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, motivo: `No se pudo generar el PDF: ${detalle}` },
      { status: 500 },
    );
  }

  const filename = nombreArchivo(factura);
  const avisos: string[] = [];
  let guardada = false;

  // 3. Supabase: subir el PDF a Storage + registrar. Si viene facturaId → edita.
  if (supabaseConfigurada()) {
    try {
      // Referencia anterior (para borrar el PDF viejo al re-generar una edición).
      const refAnterior = facturaId ? await refPdfFactura(facturaId) : null;

      const pdfRef = await subirPdfFactura(pdf, factura.numero);

      if (facturaId) {
        await actualizarRegistroFactura(facturaId, factura, pdfRef);
      } else {
        await registrarFactura(factura, pdfRef);
      }
      guardada = true;

      // Limpia el PDF anterior si era de Storage (no toca URLs legacy de Drive).
      if (refAnterior && !/^https?:/i.test(refAnterior)) {
        await borrarPdfFactura(refAnterior).catch(() => {});
      }
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      avisos.push(`No se guardó en Supabase: ${detalle}`);
    }
  } else {
    avisos.push('Supabase no configurado todavía (falta URL + service role key).');
  }

  const mensaje = guardada
    ? 'Factura generada y guardada en Supabase.'
    : 'PDF generado y descargado. (El guardado se activa al cargar las credenciales de Supabase.)';

  return NextResponse.json({
    ok: true,
    mensaje,
    filename,
    pdfBase64: Buffer.from(pdf).toString('base64'),
    guardada,
    avisos,
  });
}
