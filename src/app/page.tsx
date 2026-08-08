import Link from 'next/link';
import { FileText, Database, Search, ArrowRight, LogOut, Users } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cerrarSesion } from './login/actions';

type Feature = {
  key: string;
  titulo: string;
  descripcion: string;
  href: string;
  Icon: typeof FileText;
  estado: 'activo' | 'pronto';
};

const FEATURES: Feature[] = [
  {
    key: 'facturacion',
    titulo: 'Facturación',
    descripcion:
      'Genera facturas de venta y de gastos en segundos, en español o inglés, con el sello y la firma ya incrustados.',
    href: '/facturacion',
    Icon: FileText,
    estado: 'activo',
  },
  {
    key: 'vehiculos',
    titulo: 'Base de Datos',
    descripcion:
      'Todos los vehículos con marca, modelo, año, kilómetros, bastidor, mulkiya y documentación de origen.',
    href: '/vehiculos',
    Icon: Database,
    estado: 'activo',
  },
  {
    key: 'buscador',
    titulo: 'Buscador',
    descripcion:
      'Búsqueda automatizada de unidades en los portales de Dubái según marca, modelo, spec, kilómetros y presupuesto.',
    href: '/buscador',
    Icon: Search,
    estado: 'activo',
  },
  {
    key: 'clientes',
    titulo: 'Clientes',
    descripcion:
      'Alta de clientes (empresa o particular) con dirección, CIF y contacto, para asociarlos a facturas y vehículos.',
    href: '/clientes',
    Icon: Users,
    estado: 'activo',
  },
];

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 sm:py-14">
      {/* Encabezado */}
      <header className="flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <span className="eyebrow hidden sm:block">Centro de control</span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-c-md border border-[var(--w10)] px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-danger hover:text-danger"
              title="Cerrar sesión"
            >
              <LogOut size={14} /> Salir
            </button>
          </form>
        </div>
      </header>

      {/* Título */}
      <section className="mt-16 max-w-2xl animate-fade-up sm:mt-24">
        <p className="eyebrow">Camel Export Cars</p>
        <h1 className="mt-3 font-display text-4xl font-black leading-tight tracking-tight text-ink-1 sm:text-5xl">
          Un solo lugar para <span className="text-camel-blue">operarlo todo</span>.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-2">
          Facturación, base de datos de vehículos y búsqueda de unidades. Elige un módulo
          para empezar.
        </p>
      </section>

      {/* Módulos */}
      <section className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, titulo, descripcion, href, Icon, estado }, i) => {
          const activo = estado === 'activo';
          const inner = (
            <div
              className={`group relative flex h-full flex-col rounded-c-xl p-6 transition-transform duration-200 ${
                activo
                  ? 'glass-float glow-active hover:-translate-y-1'
                  : 'surface-1 opacity-70'
              }`}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-c-md ${
                    activo ? 'bg-accent/15 text-accent-hi' : 'surface-2 text-ink-3'
                  }`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                {activo ? (
                  <ArrowRight
                    size={18}
                    className="text-ink-3 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent-hi"
                  />
                ) : (
                  <span className="eyebrow !text-[9px] !tracking-[0.25em] text-ink-3">
                    Pronto
                  </span>
                )}
              </div>

              <h2 className="mt-5 font-display text-xl font-bold tracking-tight text-ink-1">
                {titulo}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{descripcion}</p>
            </div>
          );

          return activo ? (
            <Link key={key} href={href} className="animate-fade-up">
              {inner}
            </Link>
          ) : (
            <div key={key} aria-disabled className="animate-fade-up cursor-not-allowed">
              {inner}
            </div>
          );
        })}
      </section>

      {/* Pie */}
      <footer className="mt-auto pt-16">
        <p className="text-xs text-ink-3">Camel OS · desarrollado por Nexum AI · v0.1</p>
      </footer>
    </main>
  );
}
