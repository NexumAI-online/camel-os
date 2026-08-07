import { AlertTriangle, Lock } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { iniciarSesion } from './actions';

export const dynamic = 'force-dynamic';

const inputCls =
  'w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <form action={iniciarSesion} className="glass-float rounded-c-xl p-6">
          <div className="mb-5 flex items-center gap-2 text-ink-1">
            <Lock size={18} className="text-accent-hi" />
            <h1 className="font-display text-lg font-bold">Acceso al panel</h1>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-c-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              <AlertTriangle size={15} /> Usuario o contraseña incorrectos.
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Usuario</span>
            <input name="usuario" required autoFocus autoComplete="username" className={inputCls} />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Contraseña</span>
            <input name="contrasena" type="password" required autoComplete="current-password" className={inputCls} />
          </label>

          <button
            type="submit"
            className="mt-6 w-full rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
