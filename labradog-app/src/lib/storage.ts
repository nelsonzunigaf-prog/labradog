/**
 * Almacenamiento de archivos (fotos de paseo) — ÚNICA frontera con Cloudflare R2
 * (regla #12 de project-context). Ningún otro archivo importa el SDK de S3.
 *
 * R2 expone API S3-compatible: se usa `@aws-sdk/client-s3` con el endpoint de R2
 * y `region:'auto'`. La compresión de la imagen ocurre en el cliente
 * (`comprimir-imagen.ts`); aquí solo se sube el blob ya comprimido.
 *
 * En dev sin credenciales R2, la subida es no-op (warn + URL placeholder), para
 * no romper el flujo local. Mismo patrón defensivo que `email.ts` sin RESEND_API_KEY.
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/** Intentos totales de subida ante fallo de red/5xx (1 inicial + reintentos). */
const MAX_INTENTOS = 3;
/** Backoff lineal base entre reintentos (ms). */
const BACKOFF_MS = 100;

type CredencialesR2 = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function leerCredenciales(): CredencialesR2 | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

// Cache de proceso: el S3Client abre conexiones SSL, así que se reutiliza por la
// vida del proceso. Las env vars de R2 son estables por deploy (una rotación de
// credenciales implica redeploy = proceso nuevo), por lo que no se invalida en runtime.
let clienteCache: S3Client | null = null;

function obtenerCliente(cred: CredencialesR2): S3Client {
  if (!clienteCache) {
    clienteCache = new S3Client({
      region: 'auto',
      endpoint: `https://${cred.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cred.accessKeyId,
        secretAccessKey: cred.secretAccessKey,
      },
    });
  }
  return clienteCache;
}

/** URL pública de un objeto (dominio público del bucket configurado en R2_PUBLIC_URL). */
export function urlPublica(key: string): string {
  // Normaliza barras: tolera R2_PUBLIC_URL con trailing slash y key con leading
  // slash sin producir `host//key` (clave distinta en R2) ni `host/key` pegado.
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  const ruta = key.replace(/^\/+/, '');
  return `${base}/${ruta}`;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `true` si el error parece de red o 5xx (reintentable); `false` para 4xx. */
function esReintentable(error: unknown): boolean {
  const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  // Sin status (error de red/conexión) o 5xx → reintentar. 4xx → no.
  return status === undefined || status >= 500;
}

type SubirArchivoArgs = {
  key: string;
  contenido: Uint8Array | Buffer;
  contentType: string;
};

/**
 * Sube un archivo a R2 con reintento ante fallo de red/5xx.
 * @returns `{ url }` pública del objeto.
 */
export async function subirArchivo({
  key,
  contenido,
  contentType,
}: SubirArchivoArgs): Promise<{ url: string }> {
  const cred = leerCredenciales();

  if (!cred) {
    console.warn(`[storage] R2 no configurado — subida de "${key}" omitida (no-op dev).`);
    return { url: urlPublica(key) };
  }

  const cliente = obtenerCliente(cred);
  const comando = new PutObjectCommand({
    Bucket: cred.bucket,
    Key: key,
    Body: contenido,
    ContentType: contentType,
  });

  let ultimoError: unknown;
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      await cliente.send(comando);
      return { url: urlPublica(key) };
    } catch (error) {
      ultimoError = error;
      if (!esReintentable(error) || intento === MAX_INTENTOS) break;
      await espera(BACKOFF_MS * intento);
    }
  }

  throw new Error(`Falló la subida a R2 de "${key}" tras ${MAX_INTENTOS} intentos`, {
    cause: ultimoError,
  });
}
