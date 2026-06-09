/**
 * Compresión de imágenes EN EL CLIENTE — antes de subir fotos de paseo a R2.
 *
 * Util de navegador (lo consumen componentes cliente): reduce las fotos a redes
 * lentas/intermitentes del paseador en calle (concern #6 de architecture). La
 * subida a R2 vive aparte en `storage.ts` (server, frontera con R2): aquí solo
 * se comprime; el blob comprimido se entrega luego a una server action.
 */
import imageCompression from 'browser-image-compression';

/** Defaults del método: WebP, lado mayor ≤1600px, ≤400KB. */
export const OPCIONES_FOTO = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1600,
  fileType: 'image/webp',
  useWebWorker: true,
} as const;

/** Comprime una foto de paseo con los defaults del método. Devuelve un nuevo `File`. */
export async function comprimirImagen(file: File): Promise<File> {
  return imageCompression(file, OPCIONES_FOTO);
}
