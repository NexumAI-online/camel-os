import { notFound } from 'next/navigation';

import { InvoiceForm } from '@/components/facturacion/invoice-form';
import { obtenerFactura } from '@/lib/facturas/db';
import { listarClientesOpciones } from '@/lib/clientes/db';

export const dynamic = 'force-dynamic';

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [registro, clientes] = await Promise.all([
    obtenerFactura(id),
    listarClientesOpciones(),
  ]);
  if (!registro) notFound();

  return (
    <main className="relative min-h-screen">
      <InvoiceForm initial={registro.factura} facturaId={registro.id} clientes={clientes} />
    </main>
  );
}
