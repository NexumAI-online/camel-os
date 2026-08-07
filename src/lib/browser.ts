import 'server-only';

import puppeteer, { type Browser } from 'puppeteer-core';

/**
 * Lanzador de Chrome compartido (motor de PDFs y scrapers que necesitan un
 * navegador real para sortear muros anti-bot como el de YallaMotor).
 *
 * Dos entornos:
 *   · Serverless (Vercel/Lambda) → binario de @sparticuz/chromium.
 *   · Local (dev)               → el Chrome instalado (LOCAL_CHROME_PATH / canal 'chrome').
 */

const ES_SERVERLESS =
  !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const UA_NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function abrirNavegador(): Promise<Browser> {
  if (ES_SERVERLESS) {
    // Import dinámico: solo se carga en serverless, no infla el dev local.
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  return puppeteer.launch({
    headless: true,
    executablePath: process.env.LOCAL_CHROME_PATH || undefined,
    channel: process.env.LOCAL_CHROME_PATH ? undefined : 'chrome',
  });
}

/** Abre un navegador, corre `fn` y lo cierra pase lo que pase. */
export async function conNavegador<T>(fn: (b: Browser) => Promise<T>): Promise<T> {
  const navegador = await abrirNavegador();
  try {
    return await fn(navegador);
  } finally {
    await navegador.close();
  }
}

/**
 * Carga una URL con Chrome real y devuelve el HTML ya renderizado.
 * Para portales que bloquean el `fetch` de Node (fingerprint TLS).
 */
export async function htmlDeUrl(url: string): Promise<string> {
  return conNavegador(async (navegador) => {
    const pagina = await navegador.newPage();
    await pagina.setUserAgent(UA_NAVEGADOR);
    const resp = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (!resp || !resp.ok()) throw new Error(`${url} → HTTP ${resp?.status() ?? '??'}`);
    return pagina.content();
  });
}
