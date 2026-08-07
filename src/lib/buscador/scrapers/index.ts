import 'server-only';

import type { Portal, ResultadoScrapeado } from '../types';
import { scrapeDubicars } from './dubicars';
import { scrapeYallamotor } from './yallamotor';

export type Scraper = (
  make: string,
  opts?: { paginas?: number },
) => Promise<ResultadoScrapeado[]>;

/**
 * Portales con scraper implementado.
 * Dubizzle queda pendiente: usa un muro anti-bot (PerimeterX) que devuelve un
 * shell vacío a un fetch normal; requeriría navegador con stealth (frágil).
 */
export const SCRAPERS: Partial<Record<Portal, Scraper>> = {
  dubicars: scrapeDubicars,
  yallamotor: scrapeYallamotor,
};

/** ¿Hay scraper disponible para este portal? */
export function tieneScraper(portal: string): portal is Portal {
  return portal in SCRAPERS;
}
