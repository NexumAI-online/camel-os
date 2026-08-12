import 'server-only';

import type { Portal, ResultadoScrapeado } from '../types';
import { scrapeDubicars } from './dubicars';
import { scrapeYallamotor } from './yallamotor';
import { scrapeDubizzle, ACTOR_DUBIZZLE, inputDubizzle, mapearDubizzle } from './dubizzle';

export type Scraper = (
  make: string,
  opts?: { tope?: number },
) => Promise<ResultadoScrapeado[]>;

/**
 * Motor por portal:
 *   · dubicars   → fetch propio (gratis, rápido).
 *   · yallamotor → Chrome propio (`lib/browser.ts`) parseando el JSON-LD — el
 *     fetch directo lo bloquea, pero un navegador real pasa. GRATIS, sin Apify.
 *   · dubizzle   → Apify (actor powerbox) — muro PerimeterX (403 en el borde);
 *     es el ÚNICO que necesita Apify + crédito.
 */
export const SCRAPERS: Partial<Record<Portal, Scraper>> = {
  dubicars: scrapeDubicars,
  yallamotor: scrapeYallamotor,
  dubizzle: scrapeDubizzle,
};

/** Portales que corren vía Apify (necesitan APIFY_TOKEN). Solo Dubizzle. */
export const PORTALES_APIFY: Portal[] = ['dubizzle'];

/**
 * Config de cada portal Apify para el flujo ASÍNCRONO: cómo armar el input del
 * actor y cómo mapear sus items. Así se puede lanzar la corrida y mapear el
 * resultado por separado (lanzar ahora, ingestar cuando termine).
 * Solo Dubizzle: YallaMotor ya no usa Apify (Chrome propio).
 */
export const APIFY_CONFIG: Partial<
  Record<
    Portal,
    {
      actorId: string;
      input: (make: string, tope: number) => Record<string, unknown>;
      mapear: (items: Record<string, unknown>[]) => ResultadoScrapeado[];
    }
  >
> = {
  dubizzle: { actorId: ACTOR_DUBIZZLE, input: inputDubizzle, mapear: mapearDubizzle },
};

export function tieneScraper(portal: string): portal is Portal {
  return portal in SCRAPERS;
}
