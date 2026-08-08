import 'server-only';

/**
 * Cliente mínimo de Apify. Corre un actor y devuelve los items del dataset,
 * de forma síncrona (`run-sync-get-dataset-items`). El token vive en APIFY_TOKEN.
 */

const BASE = 'https://api.apify.com/v2';

export function apifyConfigurada(): boolean {
  return !!process.env.APIFY_TOKEN?.trim();
}

function token(): string {
  const t = process.env.APIFY_TOKEN?.trim();
  if (!t) throw new Error('APIFY_TOKEN no configurado');
  return t;
}

export async function correrActor(
  actorId: string,
  input: Record<string, unknown>,
  opts: { timeoutSecs?: number } = {},
): Promise<Record<string, unknown>[]> {
  const timeout = opts.timeoutSecs ?? 280;
  const url = `${BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token()}&timeout=${timeout}`;

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

/** Lanza una corrida ASÍNCRONA del actor y devuelve su runId (no espera). */
export async function iniciarActor(
  actorId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(`${BASE}/acts/${actorId}/runs?token=${token()}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Apify iniciar ${actorId} → HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  const id = j?.data?.id as string | undefined;
  if (!id) throw new Error(`Apify iniciar ${actorId}: sin runId`);
  return id;
}

export type EstadoRun = 'corriendo' | 'ok' | 'error';

/** Estado simplificado de una corrida. */
export async function estadoRun(runId: string): Promise<EstadoRun> {
  const res = await fetch(`${BASE}/actor-runs/${runId}?token=${token()}`, { cache: 'no-store' });
  if (!res.ok) return 'error';
  const status = (await res.json())?.data?.status as string | undefined;
  if (status === 'SUCCEEDED') return 'ok';
  if (status === 'RUNNING' || status === 'READY') return 'corriendo';
  return 'error'; // FAILED, ABORTED, TIMED-OUT
}

/** Trae los items del dataset de una corrida terminada. */
export async function itemsDeRun(runId: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE}/actor-runs/${runId}/dataset/items?token=${token()}&clean=true`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Apify items ${runId} → HTTP ${res.status}`);
  const items = await res.json();
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}
