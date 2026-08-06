import { NextResponse } from 'next/server';

import type { Factura } from '@/lib/invoice/types';
import { facturaRenderPath } from '@/lib/invoice/render-url';
import { urlToPdf } from '@/lib/pdf/render-pdf';
import { driveConfigurada, subirPdfADrive } from '@/lib/google/drive';
import { actualizarRegistroFactura, registrarFactura } from '@/lib/invoice/registro';
import { supabaseConfigurada } from '@/lib/supabase/server';

/**
 * Motor de generación de facturas (Feature 1) · arquitectura "Opción A".
 *
 * Flujo:
 *   1. Validar los datos de la factura.
 *   2. Renderizar el layout `InvoicePreview` a HTML y de ahí a PDF A4 (Chromium).
 *   3. Si Drive está configurado → subir el PDF a la carpeta de Camel.
 *   4. Si Supabase está configurado → registrar la factura (índice + link).
 *   5. Devolver el PDF en base64 para descarga inmediata + estado de cada paso.
 *
 * El PDF se genera SIEMPRE (no depende de credenciales). Drive y Supabase son
 * capas opcionales que se activan al cargar sus variables de entorno.
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
  let driveUrl: string | null = null;

  // 3. Drive (opcional).
  if (driveConfigurada()) {
    try {
      const r = await subirPdfADrive(pdf, filename);
      driveUrl = r.url;
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      avisos.push(`No se pudo subir a Drive: ${detalle}`);
    }
  } else {
    avisos.push('Drive no configurado todavía (falta el refresh token de OAuth).');
  }

  // 4. Supabase (opcional). Si viene facturaId → actualiza; si no → inserta.
  if (supabaseConfigurada()) {
    try {
      if (facturaId) {
        await actualizarRegistroFactura(facturaId, factura, driveUrl);
      } else {
        await registrarFactura(factura, driveUrl);
      }
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      avisos.push(`No se registró en Supabase: ${detalle}`);
    }
  } else {
    avisos.push('Supabase no configurado todavía (falta URL + service role key).');
  }

  const mensaje = driveUrl
    ? 'Factura generada y guardada en Drive.'
    : 'PDF generado y descargado. (Drive/Supabase se activan al cargar sus credenciales.)';

  return NextResponse.json({
    ok: true,
    mensaje,
    filename,
    pdfBase64: Buffer.from(pdf).toString('base64'),
    driveUrl,
    avisos,
  });
}
