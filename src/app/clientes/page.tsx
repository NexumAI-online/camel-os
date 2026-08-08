import Link from 'next/link';
import { ArrowLeft, Plus, Search, Users, Building2, User } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { ClickableRow } from '@/components/ui/clickable-row';
import { listarClientes } from '@/lib/clientes/db';
import { etiquetaTipoCliente } from '@/lib/clientes/types';

export const dynamic = 'force-dynamic';

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clientes = await listarClientes(q);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Centro de control
        </Link>
      </header>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">Clientes</h1>
          <p className="mt-1 text-sm text-ink-3">
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
            {q ? ` · filtrando “${q}”` : ''}
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi"
        >
          <Plus size={16} /> Nuevo cliente
        </Link>
      </div>

      <form className="mt-6 flex items-center gap-2" role="search">
        <div className="relative flex-1 sm:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar por nombre, CIF o email…"
            className="w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] py-2.5 pl-9 pr-3 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-c-md border border-[var(--w12)] px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink-1"
        >
          Buscar
        </button>
      </form>

      {clientes.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <Users size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">
            {q ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay clientes cargados.'}
          </p>
          {!q && (
            <Link href="/clientes/nuevo" className="text-sm font-semibold text-accent-hi hover:underline">
              Cargar el primero
            </Link>
          )}
        </div>
      ) : (
        <div className="glass-float mt-6 overflow-x-auto rounded-c-xl">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--w08)] text-xs uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">CIF / NIF</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <ClickableRow key={c.id} href={`/clientes/${c.id}`} className="group border-b border-[var(--w06)] last:border-0 transition-colors hover:bg-[var(--w04)]">
                  <td className="px-4 py-3">
                    <Link href={`/clientes/${c.id}`} className="font-semibold text-ink-1 group-hover:text-accent-hi">
                      {c.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-ink-2">
                      {c.tipo === 'business' ? <Building2 size={14} /> : <User size={14} />}
                      {etiquetaTipoCliente(c.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">{c.cif ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-2">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-2">{c.telefono ?? '—'}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
