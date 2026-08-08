import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { ClienteForm } from '@/components/clientes/cliente-form';
import { DeleteButton } from '@/components/clientes/form-buttons';
import { obtenerCliente } from '@/lib/clientes/db';
import { actualizarCliente, eliminarCliente } from '@/lib/clientes/actions';

export const dynamic = 'force-dynamic';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Clientes
        </Link>
      </header>

      <div className="mt-8">
        <p className="eyebrow">Clientes · editar</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
          {cliente.nombre}
        </h1>
      </div>

      <div className="mt-6">
        <ClienteForm
          action={actualizarCliente.bind(null, id)}
          cliente={cliente}
          submitLabel="Guardar cambios"
        />
      </div>

      <form action={eliminarCliente.bind(null, id)} className="mt-4 flex justify-end">
        <DeleteButton />
      </form>
    </main>
  );
}
