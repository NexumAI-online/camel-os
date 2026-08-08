import { InvoiceForm } from '@/components/facturacion/invoice-form';
import { listarClientesOpciones } from '@/lib/clientes/db';

export const dynamic = 'force-dynamic';

export default async function NuevaFacturaPage() {
  const clientes = await listarClientesOpciones();
  return (
    <main className="relative min-h-screen">
      <InvoiceForm clientes={clientes} />
    </main>
  );
}
