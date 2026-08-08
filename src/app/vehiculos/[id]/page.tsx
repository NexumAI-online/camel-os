import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Download } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { VehiculoForm } from '@/components/vehiculos/vehiculo-form';
import { DeleteButton, FotoDeleteButton, DocDeleteButton } from '@/components/vehiculos/form-buttons';
import { obtenerVehiculo } from '@/lib/vehiculos/db';
import { listarClientesOpciones } from '@/lib/clientes/db';
import { urlFirmadaDocumento } from '@/lib/vehiculos/storage';
import {
  actualizarVehiculo,
  eliminarFotoVehiculo,
  eliminarDocumentoVehiculo,
  eliminarVehiculo,
} from '@/lib/vehiculos/actions';

export const dynamic = 'force-dynamic';

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehiculo, clientes] = await Promise.all([
    obtenerVehiculo(id),
    listarClientesOpciones(),
  ]);
  if (!vehiculo) notFound();

  // URL firmada (temporal) por documento — el bucket es privado.
  const documentos = await Promise.all(
    vehiculo.documentos.map(async (doc) => ({
      ...doc,
      href: await urlFirmadaDocumento(doc.path),
    })),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/vehiculos"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Vehículos
        </Link>
      </header>

      <div className="mt-8">
        <p className="eyebrow">Base de Datos · editar</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
          {vehiculo.marca} {vehiculo.modelo}
        </h1>
      </div>

      {/* Galería de fotos actuales (borrado por foto) */}
      {vehiculo.fotos.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow mb-3">Fotos ({vehiculo.fotos.length})</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {vehiculo.fotos.map((foto) => (
              <div key={foto.path} className="group relative aspect-[4/3] overflow-hidden rounded-c-lg surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt="Foto del vehículo" className="h-full w-full object-cover" />
                <form action={eliminarFotoVehiculo.bind(null, id, foto.path)}>
                  <FotoDeleteButton />
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documentos actuales (descarga + borrado por documento) */}
      {documentos.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow mb-3">Documentos ({documentos.length})</p>
          <ul className="glass-float divide-y divide-[var(--w06)] overflow-hidden rounded-c-lg">
            {documentos.map((doc) => (
              <li key={doc.path} className="flex items-center gap-3 px-4 py-3">
                <FileText size={18} className="shrink-0 text-ink-3" />
                <span className="flex-1 truncate text-sm text-ink-1" title={doc.nombre}>
                  {doc.nombre}
                </span>
                {doc.href && (
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2 transition-colors hover:text-accent-hi"
                  >
                    <Download size={14} /> Abrir
                  </a>
                )}
                <form action={eliminarDocumentoVehiculo.bind(null, id, doc.path)}>
                  <DocDeleteButton />
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <VehiculoForm
          action={actualizarVehiculo.bind(null, id)}
          vehiculo={vehiculo}
          submitLabel="Guardar cambios"
          clientes={clientes}
        />
      </div>

      {/* Eliminar (formulario aparte con su propia acción) */}
      <form action={eliminarVehiculo.bind(null, id)} className="mt-4 flex justify-end">
        <DeleteButton />
      </form>
    </main>
  );
}
