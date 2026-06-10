'use server';

/**
 * Server Actions de la ficha del perro (Story 1.6). Solo rol admin.
 * Contrato {ok, data|error} vía crearAction (nunca throw a la UI).
 */
import { revalidatePath } from 'next/cache';
import { getActor } from '@/lib/actor';
import { crearAction, ErrorNegocio } from '@/lib/action-wrapper';
import {
  actualizarFotoPerro,
  actualizarPerro as qActualizarPerro,
  crearPerro as qCrearPerro,
  ErrorDistintoTutor,
  marcarCompatibilidad as qMarcarCompatibilidad,
  quitarCompatibilidad as qQuitarCompatibilidad,
} from '@/lib/db/queries/perros';
import { obtenerTutor } from '@/lib/db/queries/tutores';
import { subirArchivo } from '@/lib/storage';
import {
  actualizarPerroSchema,
  compatibilidadSchema,
  crearPerroSchema,
} from '@/lib/validations/perros';

const CONFLICTO = 'Este registro cambió, recarga.';

export const crearPerro = crearAction({
  schema: crearPerroSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    if (!(await obtenerTutor(input.tutorId))) {
      throw new ErrorNegocio('El tutor no existe.');
    }
    const { id } = await qCrearPerro(input, actor);
    revalidatePath(`/admin/tutores/${input.tutorId}`);
    return { id };
  },
});

export const actualizarPerro = crearAction({
  schema: actualizarPerroSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const r = await qActualizarPerro(input, actor);
    if (!r) throw new ErrorNegocio(CONFLICTO);
    revalidatePath(`/admin/perros/${input.id}`);
    return r;
  },
});

export const marcarCompatibilidad = crearAction({
  schema: compatibilidadSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    try {
      await qMarcarCompatibilidad(input, actor);
    } catch (error) {
      if (error instanceof ErrorDistintoTutor) {
        throw new ErrorNegocio('Solo se puede marcar compatibilidad entre perros del mismo tutor.');
      }
      throw error;
    }
    revalidatePath(`/admin/perros/${input.perroAId}`);
    revalidatePath(`/admin/perros/${input.perroBId}`);
    return { ok: true };
  },
});

export const quitarCompatibilidad = crearAction({
  schema: compatibilidadSchema,
  roles: ['admin'],
  handler: async (input) => {
    await qQuitarCompatibilidad(input);
    revalidatePath(`/admin/perros/${input.perroAId}`);
    revalidatePath(`/admin/perros/${input.perroBId}`);
    return { ok: true };
  },
});

/** Tamaño máximo de la foto (2 MB: ya viene comprimida a ≤400KB; margen para fallback). */
const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const TIPOS_FOTO = ['image/webp', 'image/jpeg', 'image/png'];

/**
 * Sube la foto del perro a R2 y persiste su `fotoKey`. Action aparte porque
 * `crearAction` valida un objeto Zod y no encaja con un `File` binario; verifica
 * el rol admin manualmente. storage.ts sigue siendo la ÚNICA frontera con R2.
 * Key estable `perros/{id}/foto.webp`: re-subir reemplaza (sin basura en R2).
 */
export async function subirFotoPerro(
  formData: FormData,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: 'No autenticado' };
  if (actor.rol !== 'admin') return { ok: false, error: 'No autorizado' };

  const archivo = formData.get('foto');
  const perroId = formData.get('perroId');

  if (!(archivo instanceof File) || typeof perroId !== 'string' || !perroId) {
    return { ok: false, error: 'Datos del archivo inválidos' };
  }
  if (!TIPOS_FOTO.includes(archivo.type)) {
    return { ok: false, error: 'La foto debe ser WebP, JPEG o PNG' };
  }
  if (archivo.size > MAX_FOTO_BYTES) {
    return { ok: false, error: 'La foto supera los 2 MB' };
  }

  const key = `perros/${perroId}/foto.webp`;
  const contenido = new Uint8Array(await archivo.arrayBuffer());
  await subirArchivo({ key, contenido, contentType: archivo.type });
  await actualizarFotoPerro(perroId, key, actor);

  revalidatePath(`/admin/perros/${perroId}`);
  return { ok: true, key };
}
