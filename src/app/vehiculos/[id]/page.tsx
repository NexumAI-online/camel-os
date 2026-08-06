import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { VehiculoForm } from '@/components/vehiculos/vehiculo-form';
import { DeleteButton, FotoDeleteButton } from '@/components/vehiculos/form-buttons';
import { obtenerVehiculo } from '@/lib/vehiculos/db';
import {
  actualizarVehiculo,
  eliminarFotoVehiculo,
  eliminarVehiculo,
} from '@/lib/vehiculos/actions';

export const dynamic = 'force-dynamic';

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehiculo = await obtenerVehiculo(id);
  if (!vehiculo) notFound();

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

      <div className="mt-6">
        <VehiculoForm
          action={actualizarVehiculo.bind(null, id)}
          vehiculo={vehiculo}
          submitLabel="Guardar cambios"
        />
      </div>

      {/* Eliminar (formulario aparte con su propia acción) */}
      <form action={eliminarVehiculo.bind(null, id)} className="mt-4 flex justify-end">
        <DeleteButton />
      </form>
    </main>
  );
}
