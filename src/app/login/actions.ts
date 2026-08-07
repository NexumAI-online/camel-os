'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { COOKIE_SESION, credencialesOk, crearValorSesion } from '@/lib/auth';

export async function iniciarSesion(formData: FormData) {
  const usuario = String(formData.get('usuario') ?? '').trim();
  const contrasena = String(formData.get('contrasena') ?? '');

  if (!credencialesOk(usuario, contrasena)) {
    redirect('/login?error=1');
  }

  const { valor, maxAge } = await crearValorSesion();
  const store = await cookies();
  store.set(COOKIE_SESION, valor, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });

  redirect('/');
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(COOKIE_SESION);
  redirect('/login');
}
