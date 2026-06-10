'use server';

/**
 * Server Actions de la ficha del paseador (Story 1.7). Solo rol admin.
 * Contrato {ok, data|error} vía crearAction (nunca throw a la UI).
 */
import { revalidatePath } from 'next/cache';
import { crearAction, ErrorNegocio } from '@/lib/action-wrapper';
import {
  actualizarFichaPaseador as qActualizarFicha,
  crearFichaPaseador as qCrearFicha,
  ErrorCuentaInvalida,
} from '@/lib/db/queries/paseadores';
import {
  actualizarFichaPaseadorSchema,
  fichaPaseadorSchema,
} from '@/lib/validations/paseadores';

const CONFLICTO = 'Este registro cambió, recarga.';

/** `true` si el error es la violación del unique de user_id (ficha duplicada). */
function esUniqueViolation(error: unknown): boolean {
  const codigo = (error as { code?: string })?.code;
  const mensaje = error instanceof Error ? error.message : '';
  return codigo === '23505' || mensaje.includes('paseadores_user_id_unique');
}

export const crearFichaPaseador = crearAction({
  schema: fichaPaseadorSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    let r: { id: string };
    try {
      r = await qCrearFicha(input, actor);
    } catch (error) {
      if (error instanceof ErrorCuentaInvalida) {
        throw new ErrorNegocio('La cuenta no existe o no es de un paseador.');
      }
      if (esUniqueViolation(error)) {
        throw new ErrorNegocio('Esta cuenta ya tiene ficha.');
      }
      throw error;
    }
    revalidatePath('/admin/paseadores');
    revalidatePath(`/admin/paseadores/${input.userId}`);
    return r;
  },
});

export const actualizarFichaPaseador = crearAction({
  schema: actualizarFichaPaseadorSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const r = await qActualizarFicha(input, actor);
    if (!r) throw new ErrorNegocio(CONFLICTO);
    revalidatePath('/admin/paseadores');
    return r;
  },
});
