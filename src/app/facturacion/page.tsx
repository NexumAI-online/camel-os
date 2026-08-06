import Link from 'next/link';
import { ArrowLeft, Plus, FileText, ExternalLink } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { listarFacturas } from '@/lib/facturas/db';
import { formatearImporte } from '@/lib/invoice/format';
import type { Moneda } from '@/lib/invoice/types';

export const dynamic = 'force-dynamic';

export default async function FacturacionPage() {
  const facturas = await listarFacturas();

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
          <p className="eyebrow">Facturación</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
            Facturas
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'} generadas
          </p>
        </div>
        <Link
          href="/facturacion/nueva"
          className="inline-flex items-center gap-2 rounded-c-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-camel-blue-hi"
        >
          <Plus size={16} /> Nueva factura
        </Link>
      </div>

      {facturas.length === 0 ? (
        <div className="surface-1 mt-6 flex flex-col items-center gap-3 rounded-c-xl px-6 py-16 text-center">
          <FileText size={32} className="text-ink-3" strokeWidth={1.5} />
          <p className="text-sm text-ink-2">Todavía no generaste ninguna factura.</p>
          <Link href="/facturacion/nueva" className="text-sm font-semibold text-accent-hi hover:underline">
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="glass-float mt-6 overflow-x-auto rounded-c-xl">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--w08)] text-xs uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className="group border-b border-[var(--w06)] last:border-0 transition-colors hover:bg-[var(--w04)]">
                  <td className="px-4 py-3">
                    <Link href={`/facturacion/${f.id}`} className="font-semibold text-ink-1 group-hover:text-accent-hi">
                      {f.numero || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/facturacion/${f.id}`} className="block text-ink-2 group-hover:text-ink-1">
                      {f.cliente_nombre || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{f.fecha || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-1">
                    {formatearImporte(f.total ?? 0, (f.moneda as Moneda) ?? 'AED')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f.drive_url ? (
                      <a
                        href={f.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-accent-hi"
                        title="Abrir PDF en Drive"
                      >
                        <ExternalLink size={14} /> Ver
                      </a>
                    ) : (
                      <span className="text-xs text-ink-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
