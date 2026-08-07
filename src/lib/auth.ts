/**
 * Autenticación simple del panel: un usuario/contraseña (variables de entorno)
 * y una cookie de sesión firmada con HMAC-SHA256. Sin estado en servidor.
 *
 * Usa Web Crypto (`crypto.subtle`) y `btoa`, disponibles tanto en el runtime
 * Node (server actions) como en el Edge (middleware) — misma firma en ambos.
 */

export const COOKIE_SESION = 'camel_session';
const TTL_SEG = 60 * 60 * 12; // 12 horas

function secret(): string {
  return process.env.AUTH_SECRET || 'dev-secret-inseguro-cambiar';
}

const enc = new TextEncoder();

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function firmar(dato: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(dato));
  return base64url(sig);
}

/** ¿Coinciden usuario y contraseña con las credenciales configuradas? */
export function credencialesOk(usuario: string, contrasena: string): boolean {
  const u = process.env.APP_USER ?? '';
  const p = process.env.APP_PASSWORD ?? '';
  return !!u && !!p && usuario === u && contrasena === p;
}

/** Valor firmado de la cookie de sesión: `expiración.firma`. */
export async function crearValorSesion(): Promise<{ valor: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEG;
  const firma = await firmar(String(exp));
  return { valor: `${exp}.${firma}`, maxAge: TTL_SEG };
}

/** Verifica firma + expiración de la cookie. */
export async function sesionValida(valor: string | undefined | null): Promise<boolean> {
  if (!valor) return false;
  const punto = valor.indexOf('.');
  if (punto <= 0) return false;
  const expStr = valor.slice(0, punto);
  const firma = valor.slice(punto + 1);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  return (await firmar(expStr)) === firma;
}
