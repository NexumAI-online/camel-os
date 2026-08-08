import 'server-only';

import type { Portal, ResultadoScrapeado } from '../types';
import { scrapeDubicars } from './dubicars';
import { scrapeYallamotor } from './yallamotor';
import { scrapeDubizzle } from './dubizzle';

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

export function tieneScraper(portal: string): portal is Portal {
  return portal in SCRAPERS;
}
