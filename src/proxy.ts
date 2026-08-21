import { NextResponse, type NextRequest } from 'next/server';

import { COOKIE_SESION, sesionValida } from '@/lib/auth';

/**
 * Portón de acceso (convención `proxy` de Next 16, antes `middleware`): exige
 * sesión para todo el panel. Quedan públicas:
 *   · /login             → el propio formulario de acceso.
 *   · /factura/render    → página interna que Puppeteer imprime a PDF (la abre
 *                          el servidor sin cookie; sólo renderiza datos de la URL).
 *   · /api/keep-alive    → ping del Vercel Cron a Supabase (evita el auto-pausado
 *                          del plan free); protegida por CRON_SECRET, no por cookie.
 * Los assets de Next (_next, imágenes) se excluyen en el matcher.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/factura/render') ||
    pathname.startsWith('/api/keep-alive')
  ) {
    return NextResponse.next();
  }

  const valor = req.cookies.get(COOKIE_SESION)?.value;
  if (await sesionValida(valor)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Todo salvo assets estáticos de Next y archivos con extensión (svg/png/etc).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
