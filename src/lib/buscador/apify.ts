import 'server-only';

/**
 * Cliente mínimo de Apify. Corre un actor y devuelve los items del dataset,
 * de forma síncrona (`run-sync-get-dataset-items`). El token vive en APIFY_TOKEN.
 */

const BASE = 'https://api.apify.com/v2';

export function apifyConfigurada(): boolean {
  return !!process.env.APIFY_TOKEN?.trim();
}

export async function correrActor(
  actorId: string,
  input: Record<string, unknown>,
  opts: { timeoutSecs?: number } = {},
): Promise<Record<string, unknown>[]> {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) throw new Error('APIFY_TOKEN no configurado');

  const timeout = opts.timeoutSecs ?? 280;
  const url = `${BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeout}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Apify ${actorId} → HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error(`Apify ${actorId}: respuesta inesperada`);
  }
  return items as Record<string, unknown>[];
}
