import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer y Chromium no deben pasar por el bundler del server: se usan como
  // módulos nativos externos (necesario para que el motor PDF funcione en Vercel).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Fuerza a incluir el binario de Chromium (@sparticuz/chromium/bin) en la
  // función que genera el PDF; si no, Vercel no lo empaqueta y falla en runtime.
  outputFileTracingIncludes: {
    "/api/facturas/generar": ["./node_modules/@sparticuz/chromium/**"],
  },
  experimental: {
    serverActions: {
      // Fotos y documentos de vehículos viajan por Server Actions; el default es 1MB.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
