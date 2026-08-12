import { EMISOR, TEXTOS } from '@/lib/invoice/constants';
import {
  formatearImporte,
  importeIva,
  llevaIva,
  totalConIva,
  totalFactura,
} from '@/lib/invoice/format';
import type { Factura } from '@/lib/invoice/types';

/* ─────────────────────────────────────────────────────────────
   Reproducción pixel-fiel del PDF de ECOM (Factura Nº0997).
   Colores, tamaños y fuentes extraídos del PDF original:
     · magenta  #e01b84  → fecha y monto total grande
     · navy     #283592  → título "Factura" y barra superior
     · navy     #2a3990  → headers de sección / CANTIDAD / Total
     · violeta  #6d64e8  → nombre del emisor
     · gris     #666666  → importes de línea, dirección, datos cliente
     · gris     #434343  → "Factura a:" y "Número de factura:"
     · negro    #212121/#000  → descripciones y textos legales
   Geometría en unidades del PDF (A4 = 595pt de ancho).
   Fuente: Roboto (cuerpo/títulos) + Arial (headers de tabla y legales).
   Lleva la clase `print-area` para aislarlo al imprimir.
   ───────────────────────────────────────────────────────────── */

const MAGENTA = '#e01b84';
const NAVY_TITULO = '#283592';
const NAVY = '#2a3990';
const VIOLETA = '#6d64e8';
const GRIS = '#666666';
const GRIS_LBL = '#434343';
const NEGRO = '#212121';
const FILA = '#f3f3f3';
const BORDE = '#b7b7b7';

const ARIAL = 'Arial, "Liberation Sans", sans-serif';

export function InvoicePreview({
  factura,
  selloSrc = '/factura/sello.png',
}: {
  factura: Factura;
  /** Origen de la imagen sello+firma. En el navegador usa la ruta pública;
   * al renderizar en el servidor (motor PDF) se inyecta como data-URI. */
  selloSrc?: string;
}) {
  const t = TEXTOS[factura.idioma];
  const base = totalFactura(factura.lineas);
  const conIva = llevaIva(factura);
  const iva = importeIva(factura);
  const total = totalConIva(factura);
  const direccionCliente = factura.cliente.direccion
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      className="print-area mx-auto bg-white text-black"
      style={{
        width: 595,
        maxWidth: '100%',
        fontFamily: 'var(--font-roboto), Roboto, Arial, sans-serif',
        paddingTop: 40,
        paddingBottom: 30,
      }}
    >
      {/* Barra superior navy (x50→545) */}
      <div style={{ height: 6, background: NAVY_TITULO, margin: '0 50px' }} />

      {/* Contenido: texto inset a x≈85 */}
      <div style={{ padding: '0 84px' }}>
        {/* Emisor */}
        <div style={{ marginTop: 14 }}>
          <div style={{ color: VIOLETA, fontSize: 17.3, fontWeight: 400, lineHeight: 1.1 }}>
            {EMISOR.nombre}
          </div>
          <div style={{ color: GRIS, fontSize: 8.7, lineHeight: 1.55, marginTop: 5 }}>
            {EMISOR.direccion[0]}
            <br />
            {EMISOR.direccion[1]} {EMISOR.tradeLicense}
          </div>
        </div>

        {/* Título + fecha (magenta) */}
        <div style={{ color: NAVY_TITULO, fontSize: 28.6, fontWeight: 700, marginTop: 18 }}>
          {t.titulo}
        </div>
        <div style={{ color: MAGENTA, fontSize: 10.4, fontWeight: 700, marginTop: 12 }}>
          {t.fecha}: {factura.fecha || '—'}
        </div>

        {/* Factura a / Número */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <div style={{ maxWidth: 240 }}>
            <div style={{ color: GRIS_LBL, fontSize: 10.4, fontWeight: 700 }}>{t.facturaA}</div>
            <div style={{ color: GRIS, fontSize: 8.7, lineHeight: 1.35, marginTop: 4 }}>
              {factura.cliente.nombre && <div>{factura.cliente.nombre}</div>}
              {factura.cliente.identificacion && <div>{factura.cliente.identificacion}</div>}
              {direccionCliente.map((l, i) => (
                <div key={`${l}-${i}`}>{l}</div>
              ))}
              {!factura.cliente.nombre &&
                !factura.cliente.identificacion &&
                direccionCliente.length === 0 && <div>—</div>}
            </div>
          </div>
          <div style={{ minWidth: 150 }}>
            <div style={{ color: GRIS_LBL, fontSize: 10.4, fontWeight: 700 }}>
              {t.numeroFactura}
            </div>
            <div style={{ color: GRIS, fontSize: 8.7, marginTop: 4 }}>
              {factura.numero || '—'}
            </div>
          </div>
        </div>

        {/* Sección artículos */}
        <div style={{ color: NAVY, fontSize: 10.4, fontWeight: 700, marginTop: 28 }}>
          {t.seccionArticulos}
        </div>

        {/* CANTIDAD (moneda) — alineado a la derecha, sobre la tabla */}
        <div
          style={{
            color: NAVY,
            fontSize: 10.4,
            fontWeight: 700,
            textAlign: 'right',
            marginTop: 12,
          }}
        >
          {t.colCantidad(factura.moneda)}
        </div>

        {/* Tabla */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 2,
            border: `0.7px solid ${BORDE}`,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  fontFamily: ARIAL,
                  fontSize: 8,
                  fontWeight: 700,
                  color: NEGRO,
                  padding: '4px 6px',
                  width: '48%',
                }}
              >
                {t.colDescripcion}
              </th>
              <th
                style={{
                  textAlign: 'left',
                  fontFamily: ARIAL,
                  fontSize: 8,
                  fontWeight: 700,
                  color: NEGRO,
                  padding: '4px 6px',
                }}
              >
                {t.colDetalles}
              </th>
              <th style={{ padding: '4px 6px', width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((linea, i) => {
              const notas = (linea.notaAdicional ?? '')
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean);
              return (
                <tr key={linea.id} style={{ background: i % 2 === 0 ? FILA : '#fff' }}>
                  <td style={{ padding: '5px 6px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 8.7, fontWeight: 700, color: '#000' }}>
                      {linea.descripcion || '—'}
                    </div>
                    {notas.map((n, j) => (
                      <div key={j} style={{ fontSize: 8.7, color: '#000', marginTop: 1 }}>
                        {n}
                      </div>
                    ))}
                  </td>
                  <td
                    style={{
                      padding: '5px 6px',
                      verticalAlign: 'top',
                      fontSize: 8.7,
                      color: '#000',
                    }}
                  >
                    {linea.detalles}
                  </td>
                  <td
                    style={{
                      padding: '5px 6px',
                      verticalAlign: 'top',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      fontSize: 8.7,
                      color: GRIS,
                    }}
                  >
                    {formatearImporte(linea.cantidad, factura.moneda)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total + monto grande (magenta), a la derecha.
            Con IVA se desglosa: Base imponible + IVA (%) + Total. */}
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          {conIva && (
            <>
              <div style={{ fontSize: 8.7, color: GRIS }}>
                <span style={{ fontWeight: 700 }}>{t.subtotal}</span>{' '}
                <span>{formatearImporte(base, factura.moneda)}</span>
              </div>
              <div style={{ fontSize: 8.7, color: GRIS, marginTop: 2 }}>
                <span style={{ fontWeight: 700 }}>{t.iva(factura.iva!.porcentaje)}</span>{' '}
                <span>{formatearImporte(iva, factura.moneda)}</span>
              </div>
            </>
          )}
          <div style={{ fontSize: 8.7, marginTop: conIva ? 4 : 0 }}>
            <span style={{ color: NAVY, fontWeight: 700 }}>{t.total}</span>{' '}
            <span style={{ color: '#000', fontWeight: 700 }}>
              {formatearImporte(total, factura.moneda)}
            </span>
          </div>
          <div style={{ color: MAGENTA, fontSize: 17.3, fontWeight: 700, marginTop: 12 }}>
            {formatearImporte(total, factura.moneda)}
          </div>
        </div>

        {/* Sello + firma de ECOM, abajo a la izquierda */}
        <div style={{ marginTop: -44 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selloSrc}
            alt="Sello y firma ECOM HOLDING"
            style={{ width: 92, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Términos de pago */}
        <div style={{ marginTop: 14 }}>
          <div style={{ color: NAVY, fontSize: 10.4, fontWeight: 700 }}>{t.terminosTitulo}</div>
          <div style={{ fontFamily: ARIAL, fontSize: 8, fontWeight: 700, color: NEGRO, marginTop: 6, lineHeight: 1.4 }}>
            {t.terminos.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: ARIAL, fontSize: 8, color: NEGRO, marginTop: 10, lineHeight: 1.35 }}>
            <div>
              {t.beneficiario}: {EMISOR.beneficiario}
            </div>
            <div>
              {t.swift}: {EMISOR.swift}
            </div>
            <div>
              {t.iban}: {EMISOR.iban}
            </div>
          </div>
          <div style={{ fontFamily: ARIAL, fontSize: 8, color: NEGRO, marginTop: 8 }}>
            {EMISOR.bancoDireccion}
          </div>
        </div>

        {/* Notas */}
        <div style={{ marginTop: 10 }}>
          <div style={{ color: NAVY, fontSize: 10.4, fontWeight: 700 }}>{t.notasTitulo}</div>
          <div style={{ fontFamily: ARIAL, fontSize: 8, fontWeight: 700, color: NEGRO, marginTop: 6, lineHeight: 1.4 }}>
            {t.notas.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
