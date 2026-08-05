import Link from 'next/link';
import { ArrowLeft, Car, ReceiptText } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

type Tipo = {
  key: string;
  titulo: string;
  descripcion: string;
  Icon: typeof Car;
};

const TIPOS: Tipo[] = [
  {
    key: 'venta',
    titulo: 'Factura de venta',
    descripcion:
      'Venta de un vehículo. Incluye columna de bastidor (VIN) propia, además de descripción y detalles.',
    Icon: Car,
  },
  {
    key: 'gasto',
    titulo: 'Factura de gastos',
    descripcion:
      'Gastos en origen: transporte, documentación y gestión. Multi-concepto, sin columna de bastidor.',
    Icon: ReceiptText,
  },
];

export default function FacturacionHome() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 sm:py-14">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Centro de control
        </Link>
      </header>

      <section className="mt-14 max-w-2xl animate-fade-up">
        <p className="eyebrow">Facturación</p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-ink-1 sm:text-4xl">
          ¿Qué factura querés crear?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-2">
          Emisor: <span className="text-ink-1">ECOM HOLDING LLC FZ</span> · Dubái · AED.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {TIPOS.map(({ key, titulo, descripcion, Icon }, i) => (
          <div
            key={key}
            className="glass-float animate-fade-up flex h-full flex-col rounded-c-xl p-6"
            style={{ animationDelay: `${120 + i * 90}ms` }}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-c-md bg-accent/15 text-accent-hi">
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-ink-1">
              {titulo}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{descripcion}</p>
            <span className="eyebrow mt-6 !text-[9px] !tracking-[0.25em] text-ink-3">
              Formulario en construcción
            </span>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-16">
        <p className="text-xs text-ink-3">Camel OS · desarrollado por Nexum AI · v0.1</p>
      </footer>
    </main>
  );
}
