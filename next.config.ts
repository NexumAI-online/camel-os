import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer y Chromium no deben pasar por el bundler del server: se usan como
  // módulos nativos externos (necesario para que el motor PDF funcione en Vercel).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
