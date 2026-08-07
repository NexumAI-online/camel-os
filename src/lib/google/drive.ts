import 'server-only';

import { Readable } from 'node:stream';
import { google } from 'googleapis';

/**
 * Subida del PDF de la factura a Google Drive vía OAuth (cuenta de Guillermo /
 * org nexumai.online por ahora; se transfiere a Camel más adelante).
 *
 * Requiere un refresh token obtenido una única vez autorizando el flujo de
 * consentimiento (ver README / OAuth Playground). El servidor lo usa para
 * actuar sin login interactivo.
 */

const VARS = [
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REFRESH_TOKEN',
  'DRIVE_FOLDER_ID',
] as const;

/** ¿Están todas las credenciales de Drive presentes? */
export function driveConfigurada(): boolean {
  return VARS.every((v) => !!process.env[v]?.trim());
}

/** Devuelve las variables que faltan (para mensajes claros). */
export function driveFaltantes(): string[] {
  return VARS.filter((v) => !process.env[v]?.trim());
}

export interface ResultadoDrive {
  id: string;
  url: string;
}

/** Cliente de Drive autenticado con el refresh token del servidor. */
function driveClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
  return google.drive({ version: 'v3', auth: oauth2 });
}

/** Extrae el fileId de un link de Drive (webViewLink o `?id=`). */
export function driveFileId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Descarga el contenido (bytes) de un PDF de Drive por su fileId. */
export async function descargarPdfDeDrive(fileId: string): Promise<Uint8Array> {
  const res = await driveClient().files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );
  return new Uint8Array(res.data as ArrayBuffer);
}

export async function subirPdfADrive(
  pdf: Uint8Array,
  filename: string,
): Promise<ResultadoDrive> {
  const drive = driveClient();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.DRIVE_FOLDER_ID as string],
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: Readable.from(Buffer.from(pdf)),
    },
    fields: 'id, webViewLink',
  });

  if (!res.data.id) {
    throw new Error('Drive no devolvió un ID de archivo.');
  }
  return {
    id: res.data.id,
    url: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}
