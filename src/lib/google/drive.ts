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

export async function subirPdfADrive(
  pdf: Uint8Array,
  filename: string,
): Promise<ResultadoDrive> {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2 });
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
