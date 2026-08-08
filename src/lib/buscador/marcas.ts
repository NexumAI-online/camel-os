/**
 * Interpretación amplia de la marca/modelo buscado → slug de tienda.
 * Normaliza alias comunes ("mercedes" → "mercedes-benz") para que salgan TODOS
 * los resultados vinculados, y arma la URL de búsqueda de cada portal.
 */

/** Alias de marcas (clave = texto normalizado del usuario) → slug canónico. */
const ALIAS: Record<string, string> = {
  mercedes: 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  merc: 'mercedes-benz',
  benz: 'mercedes-benz',
  mercedesbenz: 'mercedes-benz',
  vw: 'volkswagen',
  'range rover': 'land-rover',
  rangerover: 'land-rover',
  landrover: 'land-rover',
  chevy: 'chevrolet',
  'rolls royce': 'rolls-royce',
  'aston martin': 'aston-martin',
  'alfa romeo': 'alfa-romeo',
  'land cruiser': 'toyota',
};

/** Convierte lo que escribió el usuario en un slug de marca de tienda. */
export function slugMarca(consulta: string): string {
  const norm = consulta.trim().toLowerCase().replace(/\s+/g, ' ');
  if (ALIAS[norm]) return ALIAS[norm];
  return norm.replace(/\s+/g, '-');
}

export function urlDubicars(slug: string): string {
  return `https://www.dubicars.com/uae/used/${encodeURIComponent(slug)}`;
}

export function urlYallamotor(slug: string): string {
  return `https://uae.yallamotor.com/used-cars/${encodeURIComponent(slug)}`;
}

export function urlDubizzle(slug: string): string {
  return `https://dubai.dubizzle.com/motors/used-cars/${encodeURIComponent(slug)}/`;
}
