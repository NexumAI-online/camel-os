'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Building2, User, Loader2 } from 'lucide-react';

import { etiquetaTipoCliente, type Cliente } from '@/lib/clientes/types';
import { eliminarClientes } from '@/lib/clientes/actions';

export function TablaClientes({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const todos = clientes.length > 0 && sel.size === clientes.length;
  const toggleTodos = () => setSel(todos ? new Set() : new Set(clientes.map((c) => c.id)));

  function borrar(ids: string[], etiqueta: string) {
    if (!confirm(`¿Eliminar ${etiqueta}? Esta acción no se puede deshacer.`)) return;
    start(async () => {
      await eliminarClientes(ids);
      setSel(new Set());
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {/* Barra de selección múltiple */}
      {sel.size > 0 && (
        <div className="glass-float mb-3 flex items-center justify-between rounded-c-md px-4 py-2.5">
          <span className="text-sm text-ink-2">{sel.size} seleccionado{sel.size === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSel(new Set())}
              className="text-xs text-ink-3 transition-colors hover:text-ink-1"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => borrar([...sel], `${sel.size} cliente${sel.size === 1 ? '' : 's'}`)}
              className="inline-flex items-center gap-1.5 rounded-c-md bg-danger/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-danger disabled:opacity-50"
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      <div className="glass-float overflow-x-auto rounded-c-xl">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--w08)] text-xs uppercase tracking-wider text-ink-3">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={todos}
                  onChange={toggleTodos}
                  aria-label="Seleccionar todos"
                  className="h-4 w-4 accent-[var(--accent)] align-middle"
                />
              </th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">CIF / NIF</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr
                key={c.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('input, button, a, label')) return;
                  router.push(`/clientes/${c.id}`);
                }}
                className={`cursor-pointer border-b border-[var(--w06)] last:border-0 transition-colors hover:bg-[var(--w04)] ${sel.has(c.id) ? 'bg-[var(--w04)]' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={sel.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Seleccionar ${c.nombre}`}
                    className="h-4 w-4 accent-[var(--accent)] align-middle"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clientes/${c.id}`} className="font-semibold text-ink-1 hover:text-accent-hi">
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
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => borrar([c.id], `a ${c.nombre}`)}
                    title="Eliminar cliente"
                    aria-label={`Eliminar ${c.nombre}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-c-md text-ink-3 transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
