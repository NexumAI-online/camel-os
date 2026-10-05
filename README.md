# Camel OS

Panel web interno de **Camel Export Cars** (importación de autos desde Dubái a España). Cliente: Carlos Angulo Martínez. Desarrollado por Nexum.

Producción: https://camel-os-five.vercel.app (login con usuario/contraseña únicos).

## ⚠️ LEER PRIMERO — los datos NO están en este repo

Este repo es **solo el código**. Todo lo cargado (facturas, vehículos, clientes, fotos, documentos, PDFs de facturas) vive en servicios externos:

| Qué | Dónde vive | Cuenta actual |
|---|---|---|
| Base de datos (facturas, vehículos, clientes, resultados del buscador) | **Supabase** proyecto `eywshpyduqlkwplvmeoc` | Guillermo (nexum.404@gmail.com), plan **Free** |
| PDFs de facturas | Supabase Storage, bucket **privado** `facturas` | idem |
| Fotos de vehículos | Supabase Storage, bucket **público** `vehiculos` | idem |
| Documentos de vehículos | Supabase Storage, bucket **privado** `documentos` | idem |
| PDFs de facturas antiguas (legacy) | Google Drive (carpeta `DRIVE_FOLDER_ID`) | Guillermo / org nexumai.online |
| Hosting + cron | **Vercel** proyecto `camel-os` (team `team_Q0NPE5DF9CgxNE8qdbAIOjEg`), auto-deploy desde `main` | Guillermo |
| Scraping Dubizzle / YallaMotor | **Apify** (`APIFY_TOKEN`) | Pablo (salespropartner.com), plan Starter |

### Cómo continuar sin perder nada (regla de oro)

1. **NO crear un proyecto Supabase nuevo ni correr `supabase/*.sql` sobre uno nuevo para "empezar de cero".** Hay que seguir usando el proyecto existente (o migrarlo completo con sus datos y Storage).
2. Opciones para dar acceso al nuevo dev, de mejor a peor:
   - **Transferir el proyecto Supabase** a la organización del dev/Camel (Dashboard → Project Settings → General → *Transfer project*). Mantiene URL, keys, datos y buckets.
   - Invitarlo como miembro de la organización Supabase de Guillermo.
   - Pasarle `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` por canal seguro (sin acceso al dashboard).
3. Hacer lo mismo con Vercel (transferir proyecto o invitar al team) para que `git push` a `main` siga desplegando. Si se redeploya en otra cuenta, cargar **todas** las variables de abajo.
4. **Antes de tocar nada, hacer un backup** (Supabase → Database → Backups, o `pg_dump`). **El backup de la base NO incluye los archivos de Storage**: hay que bajar los 3 buckets por separado (los PDFs de facturas son el dato más valioso).
5. Cualquier cambio de esquema: **migraciones aditivas** (`add column if not exists`), nunca `drop`/`recreate` sobre tablas con datos. Se aplican a mano en el SQL Editor de Supabase y se documentan en `supabase/*.sql`.
6. Si se cambia `AUTH_SECRET` solo se cierran las sesiones; no afecta datos. Si se cambia `SUPABASE_*` a otro proyecto, se pierde el acceso a todo lo anterior.

### Riesgo conocido: Supabase Free se pausa

Supabase Free **pausa el proyecto tras ~7 días sin actividad**. Al pausarse, todas las pantallas de datos dan *server error* (el login sigue funcionando). Ya pasó el 2026-08-21; los datos volvieron intactos con *Restore* en el dashboard. Mitigaciones:
- Hay un **Vercel Cron diario** (`vercel.json` → `/api/keep-alive`, 06:00 UTC) que hace una consulta mínima. Verificar que siga activo tras un redeploy/migración (los crons de Vercel solo corren en producción).
- Recomendado: pasar a **Supabase Pro** (~25 USD/mes: no se pausa y tiene backups diarios).

## Qué hace la app

Centro de control con 4 módulos (`src/app/page.tsx`):

1. **Facturación** (`/facturacion`) — el módulo principal. Crear/editar/listar facturas de **Venta** (con columna Bastidor/VIN) y **Gastos** (multi-concepto). Bilingüe ES/EN, moneda AED/EUR, IVA opcional por factura (checkbox + %, default 21%; el importe tipeado es SIN IVA y se suma). Emisor fijo: ECOM HOLDING LLC FZ (textos y datos bancarios en `src/lib/invoice/constants.ts`). El PDF se genera renderizando la misma vista `InvoicePreview` con Chromium (Puppeteer) → PDF A4 → se sube al bucket `facturas` y se registra en la tabla `facturas`. El número de factura lo escribe el usuario a mano (no hay autonumeración).
2. **Vehículos** (`/vehiculos`) — base de datos de unidades: marca, modelo, año, km, bastidor, mulquilla (booleano: ¿tiene la tarjeta?), color, precio de compra (AED), estado (`en_dubai`/`en_transito`/`en_espana`/`vendido`), notas, **fotos** y **documentos**, y cliente asociado. Vista lista/galería, filtros y orden.
3. **Clientes** (`/clientes`) — CRUD (business/particular, CIF, dirección, contacto). Borrar un cliente NO borra sus vehículos (`on delete set null`). Las facturas guardan copia del nombre/ID/dirección del cliente (no hay FK).
4. **Buscador** (`/buscador`) — busca unidades en portales de Dubái por marca y filtros (specs, año, km, precio), guarda resultados en `busqueda_resultados` con tablero (chips por portal/color, orden, descartar). Portales: **Dubicars** (fetch propio, gratis, escaneo progresivo vía `/api/buscador/dubicars`), **Dubizzle** y **YallaMotor** (vía actores de **Apify**, de pago; tope `TOPE_APIFY`). Facebook Marketplace figura en el esquema pero no está implementado.

## Stack

Next.js **16** (App Router, Server Components + Server Actions) · React 19 · Tailwind v4 · TypeScript · Supabase (Postgres + Storage, `@supabase/supabase-js`, siempre con **service role key desde el servidor**; RLS activado sin políticas) · `puppeteer-core` + `@sparticuz/chromium` (PDF) · Apify · Vercel.

> `AGENTS.md` avisa: esta versión de Next tiene cambios de API. Antes de escribir código de framework, leer la guía correspondiente en `node_modules/next/dist/docs/`. Ej.: `src/proxy.ts` es el antiguo `middleware`.

## Puesta en marcha local

```bash
npm install
cp .env.example .env.local     # rellenar (ver tabla de variables)
npm run dev                    # http://localhost:3000  → /login
npm run build                  # debe pasar limpio antes de pushear
```

Para generar PDFs en local necesitas Chrome instalado y `LOCAL_CHROME_PATH` apuntando a él.
**Ojo:** en local, con las credenciales de producción en `.env.local`, estás operando sobre los **datos reales**. Para probar, usar un proyecto Supabase de staging (crear tablas con los `.sql`, ver orden abajo, y crear los 3 buckets).

## Variables de entorno

Plantilla en `.env.example`. Deben estar en `.env.local` (local) y en Vercel → Settings → Environment Variables (Production).

| Variable | Obligatoria | Para qué |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sí | Toda la persistencia. La service role key es secreta (solo servidor). |
| `APP_USER`, `APP_PASSWORD` | Sí | Credenciales únicas del login del panel. |
| `AUTH_SECRET` | Sí | Firma HMAC de la cookie de sesión (12 h). Sin él usa un valor inseguro por defecto. |
| `APIFY_TOKEN` | Para Dubizzle/YallaMotor | Token personal de la cuenta Apify. Dubicars no lo necesita. |
| `CRON_SECRET` | Opcional | Protege `/api/keep-alive`. |
| `LOCAL_CHROME_PATH` | Solo dev local | Chrome para el PDF. |
| `GOOGLE_OAUTH_*`, `DRIVE_FOLDER_ID` | Solo legacy | Únicamente para descargar PDFs viejos guardados en Drive (filas de `facturas` con `drive_url` que empieza por `http`). Si no quedan, se pueden eliminar `src/lib/google/drive.ts` y la rama legacy de `src/app/api/facturas/[id]/pdf/route.ts`. |

Los valores reales **no están en el repo** (`.env*` está en `.gitignore`); los entrega Guillermo por canal seguro.

## Base de datos (Supabase)

Tablas: `facturas`, `vehiculos`, `clientes`, `busqueda_resultados`. Los SQL en `supabase/` son idempotentes y ya incluyen las migraciones posteriores. Orden para un entorno **nuevo/staging**: `schema.sql` → `vehiculos.sql` → `clientes.sql` → `buscador.sql`. (`clientes.sql` altera `vehiculos`, por eso va después.)

Buckets de Storage a crear a mano en un entorno nuevo: `facturas` (privado), `vehiculos` (**público**), `documentos` (privado).

Detalles que conviene saber:
- `facturas.drive_url` es el nombre histórico de la columna: hoy guarda el **path del PDF en el bucket `facturas`**; si empieza por `http` es un PDF legacy de Drive. No renombrar sin migrar el código (`src/lib/facturas/*`, `src/lib/invoice/registro.ts`).
- `facturas.total` se guarda **ya con IVA**.
- `facturas.lineas` es `jsonb` (descripción, detalles, bastidor, cantidad/importe).
- Hay columnas opcionales (`cliente_direccion`, `lleva_iva`, `iva_porcentaje`, `color`) con degradación elegante: si faltan, la app guarda sin ellas en vez de romper. Están ya creadas en producción.

## Estructura del código

```
src/proxy.ts                  Portón de acceso (exige cookie de sesión). Públicas: /login, /factura/render, /api/keep-alive
src/lib/auth.ts               Login por env vars + cookie firmada HMAC
src/app/facturacion/…         Listado / nueva / editar factura
src/app/factura/render        Página interna que Puppeteer imprime a PDF (pública a propósito)
src/app/api/facturas/generar  Motor: render → PDF → Storage → registro en BD
src/app/api/facturas/[id]/pdf Descarga del PDF (Storage o Drive legacy)
src/components/facturacion/   invoice-form.tsx (formulario) · invoice-preview.tsx (layout del PDF, fuente única de verdad)
src/lib/invoice/              Tipos, constantes del emisor/textos bilingües, formato de importes, registro en Supabase
src/lib/pdf, src/lib/browser  Chromium/Puppeteer (local usa Chrome instalado; Vercel usa @sparticuz/chromium)
src/lib/vehiculos, clientes   Acceso a datos + Server Actions + storage de fotos/documentos
src/lib/buscador/             Scrapers (dubicars, dubizzle, yallamotor), ingesta, filtros, cliente Apify
src/app/api/keep-alive        Ping diario a Supabase (Vercel Cron)
supabase/*.sql                Esquema y migraciones
```

## Trampas y decisiones ya tomadas (no re-litigar sin motivo)

- **Cualquier ruta que use Chromium** (`src/lib/browser.ts`/PDF) debe añadirse a `outputFileTracingIncludes` en `next.config.ts`, o falla solo en Vercel (el binario no se empaqueta). Hoy solo `/api/facturas/generar`.
- **Scraping con navegador propio desde Vercel no funciona** con sitios tras Cloudflare/PerimeterX (YallaMotor, Dubizzle): bloquean IPs de datacenter. Por eso van por Apify (proxies residenciales). Dubicars no tiene ese bloqueo y va por `fetch` directo. Dubicars no admite filtros en la URL: se escanea y se filtra del lado nuestro.
- **Costo/dependencia Apify:** si se agota el crédito, Dubizzle responde 402. Actores: `powerbox~dubizzle-motors-used-cars-listing-scraper` y `stealth_mode~yallamotor-cars-search-scraper` (si el autor los cambia, el buscador de ese portal se rompe).
- El PDF se genera de la misma vista que ve el usuario (no hay plantillas Google Docs: se descartó esa vía). Cambios de diseño de factura → `invoice-preview.tsx` y `src/lib/invoice/constants.ts`.
- Subidas de fotos/docs viajan por Server Actions con límite 25 MB (`next.config.ts`).
- Las páginas de datos son Server Components que lanzan error si Supabase falla (de ahí el 500 generalizado cuando está pausado).
- La inserción del buscador va en lotes de 80 URLs (evita HTTP 414).
- El sello ECOM está en `public/factura/sello.png`.

## Pendientes / ideas abiertas

- Transferir cuentas (Supabase, Vercel, Google, Apify) de Guillermo/Pablo a Camel o al nuevo dev.
- Confirmar con Carlos si el importe tipeado con IVA debería interpretarse como "IVA incluido" (hoy se suma).
- Facebook Marketplace en el buscador (no implementado).
- Autonumeración de facturas (hoy manual).
- Política RLS + auth de Supabase por usuario si algún día hay más de un usuario (hoy es un login único).
- Staging separado de producción.

## Despliegue

`git push origin main` → Vercel despliega solo. Manual: `vercel --prod` (requiere `vercel link`; el `.vercel/` no se versiona). Tras cambiar variables de entorno en Vercel hay que **redeployar**.
