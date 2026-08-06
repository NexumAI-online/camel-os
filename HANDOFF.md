# Camel OS — Handoff / Resumen de sesión

> Panel web para **Camel Export Cars** (importadora de autos Dubái→España), cliente **Carlos Angulo**, por **Nexum**.
> Última sesión: **2026-08-05**. Estado: formularios de factura (venta/gastos) con preview WYSIWYG e impresión listos. Falta solo la integración Google Docs (bloqueada por credenciales).

---

## ▶️ Cómo retomar (mañana)

```bash
cd C:\Users\MiPc\Documents\Claude\proyectos\camel-os
npm run dev        # http://localhost:3000
```

- Árbol de git **limpio**, 1 commit (`main`). Remote ya apunta a `NexumAI-online/camel-os`.
- `npm run build` pasa limpio (TS OK, rutas `/` y `/facturacion` prerenderizan).

---

## ✅ Hecho en esta sesión

- Proyecto nuevo: **Next.js 16 + React 19 + Tailwind v4 + TypeScript** (App Router, `src/`).
- Sistema de diseño **"Obsidiana y Cristal"** portado a Tailwind v4 → `src/app/globals.css` (bi-tema oscuro/claro, azul Camel `#1E6FF2`, fuentes Archivo + Inter).
- `src/components/backgrounds/night-road.tsx` (fondo) · `src/components/brand/logo.tsx` (wordmark CAMEL EXPORT. / Cars).
- **Centro de control** (`src/app/page.tsx`): 3 bloques → Facturación (activo), Base de Datos y Buscador (Pronto).
- **`/facturacion`** (`src/app/facturacion/page.tsx`): selector de tipo → Venta (con bastidor) / Gastos (multi-concepto). *Formularios aún no construidos.*

## ✅ Hecho en la sesión 2026-08-05 — Formularios de factura

- Modelo de datos + helpers: `src/lib/invoice/{types,constants,format}.ts` (emisor ECOM y textos fijos **bilingües ES/EN**; formato de importe estilo PDF `16.967AED`).
- **Preview WYSIWYG** fiel al PDF Nº0997: `src/components/facturacion/invoice-preview.tsx` (papel blanco, imprimible).
- **Formulario** cliente con estado: `src/components/facturacion/invoice-form.tsx`
  - Líneas **multi-concepto** dinámicas (añadir/quitar), toggles **ES/EN** y **AED/EUR**, totales en vivo.
  - Venta = columna **Bastidor/VIN** propia · Gastos = sin bastidor (ruta `Dubai - Spain` por defecto).
- Rutas `/facturacion/venta` y `/facturacion/gasto`; selector de `/facturacion` ya enlaza a ambas.
- **Impresión**: `@media print` en globals.css aísla `.print-area` → botón "Imprimir / PDF" da salida usable **hoy** sin credenciales.
- **Stub del motor**: `src/app/api/facturas/generar/route.ts` valida datos y, si faltan credenciales, responde 501 explícito (lista las env que faltan). `.env.example` documenta las vars.
- `npm run build` limpio · smoke test OK (rutas 200, API validando).

## ⏭️ Próximo paso — Integración Google Docs (Feature 1, cierre)

Solo queda el motor real, **bloqueado por credenciales** (ver abajo). Cuando lleguen:
1. Implementar el TODO de `route.ts`: auth Google → copiar plantilla `TEMPLATE_{TIPO}_{IDIOMA}` → `replaceAllText` de `{{VARS}}` → mover a `DRIVE_FOLDER_ID` → exportar PDF.
2. Incrustar **sello + firma** (hoy hay placeholder punteado "Sello ECOM" en el preview).
3. (Opcional) Panel de **facturas recientes** leyendo la carpeta Drive.
> ⚠️ Verificar con Carlos las **columnas exactas de la factura de Venta**: asumí `Descripción | Detalles | Bastidor | Cantidad`. El PDF de ejemplo es de Gastos.

## 🔴 Bloqueado — necesito de Guillermo/Carlos

1. **Crear repo vacío** `NexumAI-online/camel-os` (sin README/.gitignore) → luego `git push -u origin main`.
2. **Credenciales de Camel** para el motor de facturas:
   - Proyecto Google Cloud + **OAuth Client ID** propio (con el dominio de deploy autorizado).
   - **4 plantillas Google Docs** con branding ECOM HOLDING: {Venta, Gasto} × {ES, EN}.
   - **IDs de carpetas Drive** destino.
   - Imágenes de **sello** y **firma** (el sello se puede extraer del PDF de ejemplo).

## 📋 Specs de factura (de reunión + PDF de ejemplo)

- Emisor fijo: **ECOM HOLDING LLC FZ** · Meydan, Dubái · Trade License 2312151.01 · SWIFT MEBLAEADXXX · IBAN AE020340003708515994301.
- Moneda **AED** (opción EUR). Ruta **Dubai – Spain** precargada.
- Venta = tabla `Descripción | Detalles | Bastidor`. Gastos = `Descripción | Detalles | Cantidad` (VIN puede ir en el texto).
- Términos de pago + notas bancarias fijos. Sello + firma incrustados.

## 📚 Referencias (SOLO LECTURA — no editar ni construir sobre ellas)

- `github.com/NexumAI-online/fac_nexum` — motor de facturas (Vite, client-side, Google Docs/Drive API).
  ⚠️ Trae **secretos de producción de Nexum** — Camel usa los suyos.
  Archivos clave estudiados: `src/lib/googleDocs.ts` (copyTemplate/replaceVariables/moveToFolder/export PDF), `src/lib/invoiceGenerator.ts` (nº factura + mapeo `{{VARS}}`), `src/lib/constants.ts`, `src/types/invoice.ts`.
- `github.com/NexumAI-online/camel-scraping-system` (rama `rediseno-obsidiana`) — identidad de diseño Obsidiana.
- PDF de ejemplo: `C:\Users\MiPc\Documents\Claude\Factura Nº0997 … 1G1YC2D4XP5125578.pdf`.

## 🎯 Decisiones tomadas (no re-litigar)

- Base = **Next.js, todo nuevo** en `camel-os`. **No** partir de fac_nexum (Vite) ni tocar repos existentes.
- Repo destino = `NexumAI-online/camel-os`.
- Ir **de a 1 feature**: primero Facturación.
