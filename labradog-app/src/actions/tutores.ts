'use server';

/**
 * Server Actions de la ficha del tutor (Story 1.5). Solo rol admin.
 * Contrato {ok, data|error} vía crearAction (nunca throw a la UI).
 */
import { revalidatePath } from 'next/cache';
import { getActor } from '@/lib/actor';
import { crearAction, ErrorNegocio } from '@/lib/action-wrapper';
import {
  actualizarTutor as qActualizarTutor,
  crearTutor as qCrearTutor,
  registrarAnexo as qRegistrarAnexo,
  registrarEntrevista as qRegistrarEntrevista,
} from '@/lib/db/queries/tutores';
import { subirArchivo } from '@/lib/storage';
import {
  actualizarTutorSchema,
  anexoSchema,
  crearTutorSchema,
  entrevistaSchema,
} from '@/lib/validations/tutores';

const CONFLICTO = 'Este registro cambió, recarga.';

export const crearTutor = crearAction({
  schema: crearTutorSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const { id } = await qCrearTutor(input, actor);
    revalidatePath('/admin/tutores');
    return { id };
  },
});

export const actualizarTutor = crearAction({
  schema: actualizarTutorSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const r = await qActualizarTutor(input, actor);
    if (!r) throw new ErrorNegocio(CONFLICTO);
    revalidatePath('/admin/tutores');
    revalidatePath(`/admin/tutores/${input.id}`);
    return r;
  },
});

export const registrarEntrevista = crearAction({
  schema: entrevistaSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const r = await qRegistrarEntrevista(input, actor);
    if (!r) throw new ErrorNegocio(CONFLICTO);
    revalidatePath(`/admin/tutores/${input.id}`);
    return r;
  },
});

export const registrarAnexo = crearAction({
  schema: anexoSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    await qRegistrarAnexo(input, actor);
    revalidatePath(`/admin/tutores/${input.tutorId}`);
    return { ok: true };
  },
});

/** Tamaño máximo del PDF de anexo (5 MB). */
const MAX_PDF_BYTES = 5 * 1024 * 1024;

/**
 * Sube el PDF de un anexo a R2 y devuelve su `key`. Action aparte porque
 * `crearAction` valida un objeto Zod y no encaja con un `File` binario; verifica
 * el rol admin manualmente. storage.ts sigue siendo la ÚNICA frontera con R2.
 */
export async function subirAnexoPdf(
  formData: FormData,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: 'No autenticado' };
  if (actor.rol !== 'admin') return { ok: false, error: 'No autorizado' };

  const archivo = formData.get('pdf');
  const tutorId = formData.get('tutorId');
  const tipo = formData.get('tipo');

  if (!(archivo instanceof File) || typeof tutorId !== 'string' || typeof tipo !== 'string') {
    return { ok: false, error: 'Datos del archivo inválidos' };
  }
  if (archivo.type !== 'application/pdf') {
    return { ok: false, error: 'El anexo debe ser un PDF' };
  }
  if (archivo.size > MAX_PDF_BYTES) {
    return { ok: false, error: 'El PDF supera los 5 MB' };
  }

  const contenido = new Uint8Array(await archivo.arrayBuffer());
  const { url } = await subirArchivo({
    key: `anexos/${tutorId}/${tipo}.pdf`,
    contenido,
    contentType: 'application/pdf',
  });
  // La `key` es la ruta dentro del bucket; la URL pública la arma storage.urlPublica.
  void url;
  return { ok: true, key: `anexos/${tutorId}/${tipo}.pdf` };
}
