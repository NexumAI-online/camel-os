import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { VehiculoForm } from '@/components/vehiculos/vehiculo-form';
import { crearVehiculo } from '@/lib/vehiculos/actions';

export default function NuevoVehiculoPage() {
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
        <p className="eyebrow">Base de Datos</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
          Nuevo vehículo
        </h1>
      </div>

      <div className="mt-6">
        <VehiculoForm action={crearVehiculo} submitLabel="Guardar vehículo" />
      </div>
    </main>
  );
}
