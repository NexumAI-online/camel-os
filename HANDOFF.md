# Camel OS — Handoff / Resumen de sesión

> Panel web para **Camel Export Cars** (importadora de autos Dubái→España), cliente **Carlos Angulo**, por **Nexum**.
> Última sesión: **2026-08-04**. Estado: scaffold + centro de control listos y compilando. Falta el motor de facturas.

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

## ⏭️ Próximo paso — Motor de facturación (Feature 1)

Construir sobre `/facturacion`:
1. Formulario **Venta** (con columna bastidor/VIN) y **Gastos** (multi-concepto, sin bastidor).
2. **Multi-concepto** (líneas dinámicas: descripción / detalles / cantidad AED).
3. **Toggle ES/EN** → selecciona plantilla Docs distinta.
4. Generación: Google OAuth → copia plantilla Docs → `replaceAllText` de `{{VARS}}` → mover a carpeta Drive → exportar PDF.
5. Panel de **facturas recientes** (lee la carpeta Drive).
> Se puede codear todo con variables de entorno como placeholder; queda operativo al cargar credenciales.

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
