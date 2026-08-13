import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer y Chromium no deben pasar por el bundler del server: se usan como
  // módulos nativos externos (necesario para que el motor PDF funcione en Vercel).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Fuerza a incluir el binario de Chromium (@sparticuz/chromium/bin) en las
  // funciones que abren un navegador; si no, Vercel no lo empaqueta y falla en
  // runtime. Aplica al motor de PDFs Y al scraper de YallaMotor (Chrome propio).
  outputFileTracingIncludes: {
    "/api/facturas/generar": ["./node_modules/@sparticuz/chromium/**"],
    "/api/buscador/yallamotor": ["./node_modules/@sparticuz/chromium/**"],
  },
  experimental: {
    serverActions: {
      // Fotos y documentos de vehículos viajan por Server Actions; el default es 1MB.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
