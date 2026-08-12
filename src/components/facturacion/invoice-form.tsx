'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Printer, Send, Star, Trash2 } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { InvoicePreview } from './invoice-preview';
import { RUTA_DEFECTO } from '@/lib/invoice/constants';
import { totalFactura, formatearImporte, importeIva, totalConIva } from '@/lib/invoice/format';
import type {
  Factura,
  Idioma,
  LineaFactura,
  Moneda,
  TipoFactura,
} from '@/lib/invoice/types';
import type { ClienteOpcion } from '@/lib/clientes/types';

let contador = 0;
const nuevoId = () => `l${++contador}`;
const MONEDAS: Moneda[] = ['AED', 'EUR', 'USD'];
const KEY_MONEDA_DEFAULT = 'camel_moneda_default';
/** IVA por defecto al activar el desglose (España = 21%). Es editable. */
const IVA_DEFECTO = 21;

function lineaVacia(): LineaFactura {
  return {
    id: nuevoId(),
    descripcion: '',
    detalles: RUTA_DEFECTO,
    notaAdicional: '',
    cantidad: 0,
  };
}

// Tipo interno de la factura (por ahora único). Se conserva en el modelo por si
// más adelante Carlos necesita plantillas Google Docs distintas (venta/gasto).
const TIPO: TipoFactura = 'gasto';

/** Formatea dígitos a dd/mm/aaaa insertando las barras automáticamente. */
function formatearFecha(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  const partes = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return partes.join('/');
}

/** Fecha de hoy en España (Europe/Madrid) como dd/mm/aaaa. */
function fechaHoyEspana(): string {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

export function InvoiceForm({
  initial,
  facturaId,
  clientes = [],
}: {
  /** Datos iniciales para editar una factura existente. */
  initial?: Factura;
  /** Id de la factura en edición (si se envía, "Generar" actualiza en vez de crear). */
  facturaId?: string;
  /** Clientes existentes para autocompletar los datos. */
  clientes?: ClienteOpcion[];
} = {}) {
  const router = useRouter();
  const editando = !!facturaId;
  const formRef = useRef<HTMLDivElement>(null);
  const [idioma, setIdioma] = useState<Idioma>(initial?.idioma ?? 'en'); // default inglés
  const [moneda, setMoneda] = useState<Moneda>(initial?.moneda ?? 'AED');
  const [monedaDefault, setMonedaDefault] = useState<Moneda | null>(null);
  const [numero, setNumero] = useState(initial?.numero ?? '');
  const [fecha, setFecha] = useState(initial?.fecha ?? '');
  // La fecha arranca con la de hoy (España) salvo en edición. Se borra al primer clic.
  const [fechaAuto, setFechaAuto] = useState(!initial);
  const [clienteNombre, setClienteNombre] = useState(initial?.cliente.nombre ?? '');
  const [clienteId, setClienteId] = useState(initial?.cliente.identificacion ?? '');
  const [clienteDireccion, setClienteDireccion] = useState(initial?.cliente.direccion ?? '');
  const [clienteSel, setClienteSel] = useState('');
  const [llevaIva, setLlevaIva] = useState<boolean>(!!initial?.iva?.activo);
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(
    initial?.iva?.porcentaje ?? IVA_DEFECTO,
  );

  function elegirCliente(id: string) {
    setClienteSel(id);
    const c = clientes.find((x) => x.id === id);
    if (!c) return;
    setClienteNombre(c.nombre);
    setClienteId(c.cif ?? '');
    setClienteDireccion(c.direccion ?? '');
  }
  const [lineas, setLineas] = useState<LineaFactura[]>(() =>
    initial && initial.lineas.length
      ? initial.lineas.map((l) => ({ ...l, id: l.id || nuevoId() }))
      : [lineaVacia()],
  );
  const [estado, setEstado] = useState<{ tipo: 'idle' | 'ok' | 'error'; msg: string }>({
    tipo: 'idle',
    msg: '',
  });
  const [enviando, setEnviando] = useState(false);

  // Aplica la moneda predeterminada guardada (evita mismatch de hidratación).
  useEffect(() => {
    try {
      const guardada = localStorage.getItem(KEY_MONEDA_DEFAULT) as Moneda | null;
      if (guardada && MONEDAS.includes(guardada)) {
        setMonedaDefault(guardada);
        if (!initial) setMoneda(guardada); // en edición se respeta la moneda de la factura
      }
    } catch {
      /* localStorage no disponible */
    }
  }, [initial]);

  // Prefill de la fecha con hoy (España). En edición se conserva la fecha guardada.
  useEffect(() => {
    if (initial) return;
    setFecha(fechaHoyEspana());
  }, [initial]);

  function fijarMonedaDefault() {
    try {
      localStorage.setItem(KEY_MONEDA_DEFAULT, moneda);
      setMonedaDefault(moneda);
    } catch {
      /* ignore */
    }
  }

  const factura: Factura = useMemo(
    () => ({
      tipo: TIPO,
      idioma,
      moneda,
      numero,
      fecha,
      cliente: {
        nombre: clienteNombre,
        identificacion: clienteId,
        direccion: clienteDireccion,
      },
      lineas,
      iva: { activo: llevaIva, porcentaje: ivaPorcentaje },
    }),
    [idioma, moneda, numero, fecha, clienteNombre, clienteId, clienteDireccion, lineas, llevaIva, ivaPorcentaje],
  );

  const base = totalFactura(lineas);
  const montoIva = importeIva(factura);
  const total = totalConIva(factura);

  function actualizarLinea(id: string, campo: keyof LineaFactura, valor: string | number) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function quitarLinea(id: string) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  /** Enter salta al siguiente campo (en <textarea> deja hacer salto de línea). */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Enter') return;
    const el = e.target as HTMLElement;
    if (el.tagName === 'TEXTAREA') return;
    if (el.tagName !== 'INPUT') return;
    e.preventDefault();
    const root = formRef.current;
    if (!root) return;
    const campos = Array.from(
      root.querySelectorAll<HTMLElement>('input, select, textarea'),
    ).filter((n) => !(n as HTMLInputElement).disabled && n.offsetParent !== null);
    const i = campos.indexOf(el);
    if (i >= 0 && i + 1 < campos.length) campos[i + 1].focus();
  }

  async function generar() {
    setEnviando(true);
    setEstado({ tipo: 'idle', msg: '' });
    try {
      const res = await fetch('/api/facturas/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaId ? { ...factura, facturaId } : factura),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Descarga el PDF devuelto por la API.
        if (data.pdfBase64) {
          const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename ?? 'factura.pdf';
          a.click();
          URL.revokeObjectURL(url);
        }
        setEstado({ tipo: 'ok', msg: data.mensaje ?? 'Factura generada.' });
        // Vuelve al listado de facturas (refresca los datos del server).
        router.push('/facturacion');
        router.refresh();
      } else {
        setEstado({ tipo: 'error', msg: data.motivo ?? 'No se pudo generar la factura.' });
      }
    } catch {
      setEstado({ tipo: 'error', msg: 'Error de red al contactar el servidor.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 sm:px-10">
      {/* Cabecera */}
      <header className="flex items-center justify-between no-print">
        <Logo size="sm" />
        <Link
          href="/facturacion"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1"
        >
          <ArrowLeft size={16} /> Facturas
        </Link>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* ── Columna izquierda: formulario ── */}
        <div ref={formRef} onKeyDown={onKeyDown} className="no-print">
          <p className="eyebrow">Facturación</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink-1">
            {editando ? 'Editar factura' : 'Nueva factura'}
          </h1>
          <p className="mt-2 text-xs text-ink-3">
            Consejo: pulsá <kbd className="rounded bg-[var(--w08)] px-1">Enter</kbd> para saltar al
            siguiente campo.
          </p>

          {/* Toggles idioma / moneda */}
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <Segmented
              label="Idioma"
              value={idioma}
              onChange={(v) => setIdioma(v as Idioma)}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'es', label: 'ES' },
              ]}
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium text-ink-2">Moneda</span>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] p-1">
                  {MONEDAS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={`relative rounded-c-sm px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                        moneda === m ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink-1'
                      }`}
                    >
                      {m}
                      {monedaDefault === m && (
                        <Star
                          size={9}
                          className="absolute right-0.5 top-0.5 fill-current text-warn"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={fijarMonedaDefault}
                  disabled={monedaDefault === moneda}
                  title="Usar esta moneda por defecto al abrir el formulario"
                  className="inline-flex items-center gap-1.5 rounded-c-md border border-[var(--w12)] px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink-1 disabled:opacity-45"
                >
                  <Star size={13} className={monedaDefault === moneda ? 'fill-warn text-warn' : ''} />
                  {monedaDefault === moneda ? 'Predeterminada' : 'Fijar predeterminada'}
                </button>
              </div>
            </div>
          </div>

          {/* Datos generales */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Campo label="Número de factura">
              <input
                className={inputCls}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="0998"
              />
            </Campo>
            <Campo label="Fecha (hoy · solo números)">
              <input
                className={inputCls}
                value={fecha}
                inputMode="numeric"
                maxLength={10}
                onFocus={() => {
                  if (fechaAuto) {
                    setFecha('');
                    setFechaAuto(false);
                  }
                }}
                onChange={(e) => {
                  setFecha(formatearFecha(e.target.value));
                  if (fechaAuto) setFechaAuto(false);
                }}
                placeholder="dd/mm/aaaa"
              />
            </Campo>
          </div>

          {/* Cliente */}
          <div className="mt-8">
            <p className="eyebrow">Factura a</p>
            {clientes.length > 0 && (
              <div className="mt-3">
                <Campo label="Cliente existente (autocompleta los datos)">
                  <select
                    className={inputCls}
                    value={clienteSel}
                    onChange={(e) => elegirCliente(e.target.value)}
                  >
                    <option value="">— Cargar manualmente —</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                        {c.cif ? ` · ${c.cif}` : ''}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Campo label="Nombre / Razón social">
                <input
                  className={inputCls}
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="FUTURE 24 SL"
                />
              </Campo>
              <Campo label="CIF / NIF / Tax ID">
                <input
                  className={inputCls}
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  placeholder="B75638452"
                />
              </Campo>
            </div>
            <Campo label="Dirección" className="mt-4">
              <textarea
                className={`${inputCls} min-h-20 resize-y`}
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                placeholder={'CALLE BOTIGUERS, NUM 3\nPLANTA 2, PUERTA B\n46980 PATERNA - (VALENCIA)'}
              />
            </Campo>
          </div>

          {/* Líneas */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Artículos / servicios</p>
              <span className="text-xs text-ink-3">
                Total:{' '}
                <span className="tabular font-semibold text-ink-1">
                  {formatearImporte(total, moneda)}
                </span>
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {lineas.map((linea, i) => (
                <div key={linea.id} className="surface-2 rounded-c-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-3">Concepto {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => quitarLinea(linea.id)}
                      disabled={lineas.length === 1}
                      className="inline-flex items-center gap-1 text-xs text-ink-3 transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Quitar
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <Campo label="Descripción (el VIN puede ir aquí)">
                        <input
                          className={inputCls}
                          value={linea.descripcion}
                          onChange={(e) => actualizarLinea(linea.id, 'descripcion', e.target.value)}
                          placeholder="Freight - Transport · 1G1YC2D4XP5125578"
                        />
                      </Campo>
                      <Campo label={`Cantidad (${moneda})`} className="sm:w-40">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          className={`${inputCls} tabular`}
                          value={
                            Number.isFinite(linea.cantidad) && linea.cantidad !== 0
                              ? linea.cantidad
                              : ''
                          }
                          onChange={(e) =>
                            actualizarLinea(
                              linea.id,
                              'cantidad',
                              e.target.value === '' ? 0 : Number(e.target.value),
                            )
                          }
                          placeholder="0"
                        />
                      </Campo>
                    </div>

                    <Campo label="Detalles">
                      <input
                        className={inputCls}
                        value={linea.detalles}
                        onChange={(e) => actualizarLinea(linea.id, 'detalles', e.target.value)}
                        placeholder={RUTA_DEFECTO}
                      />
                    </Campo>

                    <Campo label="Detalle adicional (opcional, aparece bajo la descripción)">
                      <textarea
                        className={`${inputCls} min-h-14 resize-y`}
                        value={linea.notaAdicional ?? ''}
                        onChange={(e) =>
                          actualizarLinea(linea.id, 'notaAdicional', e.target.value)
                        }
                        placeholder="Revisado y reacondicionado íntegramente, documentos necesarios en origen"
                      />
                    </Campo>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-3 inline-flex items-center gap-2 rounded-c-md border border-dashed border-[var(--w16)] px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-accent hover:text-accent-hi"
            >
              <Plus size={15} /> Añadir concepto
            </button>
          </div>

          {/* IVA / impuestos */}
          <div className="mt-8">
            <p className="eyebrow">Impuestos</p>
            <div className="surface-2 mt-3 rounded-c-lg p-4">
              <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink-1">
                <input
                  type="checkbox"
                  checked={llevaIva}
                  onChange={(e) => setLlevaIva(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Esta factura lleva IVA
              </label>

              {llevaIva && (
                <div className="mt-4 space-y-3">
                  <Campo label="Porcentaje de IVA (%)" className="sm:w-48">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step="0.1"
                      className={`${inputCls} tabular`}
                      value={Number.isFinite(ivaPorcentaje) ? ivaPorcentaje : ''}
                      onChange={(e) =>
                        setIvaPorcentaje(e.target.value === '' ? 0 : Number(e.target.value))
                      }
                      placeholder="21"
                    />
                  </Campo>

                  {/* Desglose en vivo */}
                  <div className="rounded-c-md border border-[var(--w08)] bg-[var(--inputDeep)] px-3 py-2.5 text-xs">
                    <div className="flex items-center justify-between text-ink-2">
                      <span>Base imponible</span>
                      <span className="tabular">{formatearImporte(base, moneda)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-ink-2">
                      <span>IVA ({ivaPorcentaje}%)</span>
                      <span className="tabular">{formatearImporte(montoIva, moneda)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between border-t border-[var(--w08)] pt-1.5 font-semibold text-ink-1">
                      <span>Total</span>
                      <span className="tabular">{formatearImporte(total, moneda)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generar}
              disabled={enviando}
              className="inline-flex items-center gap-2 rounded-c-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
            >
              <Send size={15} /> {enviando ? 'Generando…' : 'Generar factura'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-c-md border border-[var(--w12)] px-5 py-2.5 text-sm font-medium text-ink-1 transition-colors hover:border-accent"
            >
              <Printer size={15} /> Guardar como PDF
            </button>
          </div>

          {estado.tipo !== 'idle' && (
            <p
              className={`mt-4 rounded-c-md px-4 py-3 text-sm ${
                estado.tipo === 'ok' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'
              }`}
            >
              {estado.msg}
            </p>
          )}
        </div>

        {/* ── Columna derecha: preview ── */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <p className="eyebrow no-print mb-3">Vista previa</p>
          <div className="w-fit overflow-x-auto rounded-c-lg shadow-2xl ring-1 ring-[var(--w10)]">
            <InvoicePreview factura={factura} />
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent';

function Campo({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>
      <div className="inline-flex rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-c-sm px-4 py-1.5 text-sm font-semibold transition-colors ${
              value === o.value ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink-1'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
