import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAdmin, supabaseConfigurada } from '@/lib/supabase/server';

/**
 * Keep-alive de Supabase (evita el auto-pausado del plan gratuito).
 *
 * El proyecto Supabase en plan free se PAUSA tras ~7 días sin actividad y, al
 * pausarse, todas las interfaces (que leen de la base al cargar) devuelven 500.
 * Esta ruta hace una consulta mínima para que Supabase considere el proyecto
 * activo. La dispara el Vercel Cron definido en `vercel.json` (diario).
 *
 * Ruta pública en el `proxy` (no exige sesión). Si está configurado
 * `CRON_SECRET`, se exige que la petición traiga `Authorization: Bearer <secret>`
 * (Vercel lo envía automáticamente en las invocaciones de Cron), de modo que
 * nadie externo pueda golpearla; sin `CRON_SECRET`, queda abierta (solo hace
 * una lectura inofensiva).
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'no autorizado' }, { status: 401 });
    }
  }

  if (!supabaseConfigurada()) {
    return NextResponse.json({ ok: false, error: 'supabase sin configurar' }, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    // Consulta mínima: cuenta de una tabla estable, sin traer filas.
    const { error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, pinged: 'clientes' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
