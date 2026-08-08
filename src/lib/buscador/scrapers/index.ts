import 'server-only';

import type { Portal, ResultadoScrapeado } from '../types';
import { scrapeDubicars } from './dubicars';
import { scrapeYallamotor, ACTOR_YALLA, inputYalla, mapearYalla } from './yallamotor';
import { scrapeDubizzle, ACTOR_DUBIZZLE, inputDubizzle, mapearDubizzle } from './dubizzle';

export type Scraper = (
  make: string,
  opts?: { tope?: number },
) => Promise<ResultadoScrapeado[]>;

/**
 * Motor por portal:
 *   · dubicars   → fetch propio (gratis, rápido).
 *   · yallamotor → Apify (actor stealth_mode) — el fetch directo lo bloquea.
 *   · dubizzle   → Apify (actor powerbox) — protegido por PerimeterX.
 * Los dos de Apify requieren APIFY_TOKEN.
 */
export const SCRAPERS: Partial<Record<Portal, Scraper>> = {
  dubicars: scrapeDubicars,
  yallamotor: scrapeYallamotor,
  dubizzle: scrapeDubizzle,
};

/** Portales que corren vía Apify (necesitan APIFY_TOKEN). */
export const PORTALES_APIFY: Portal[] = ['yallamotor', 'dubizzle'];

/**
 * Config de cada portal Apify para el flujo ASÍNCRONO: cómo armar el input del
 * actor y cómo mapear sus items. Así se puede lanzar la corrida y mapear el
 * resultado por separado (lanzar ahora, ingestar cuando termine).
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
  yallamotor: { actorId: ACTOR_YALLA, input: inputYalla, mapear: mapearYalla },
  dubizzle: { actorId: ACTOR_DUBIZZLE, input: inputDubizzle, mapear: mapearDubizzle },
};

export function tieneScraper(portal: string): portal is Portal {
  return portal in SCRAPERS;
}
