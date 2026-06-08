'use server';

/**
 * Server Actions de gestión de cuentas del equipo (Story 1.3).
 * Solo rol admin. Contrato {ok, data|error} vía crearAction (nunca throw a UI).
 */
import { revalidatePath } from 'next/cache';
import { crearAction, ErrorNegocio } from '@/lib/action-wrapper';
import { auth } from '@/lib/auth';
import {
  buscarPorEmail,
  cambiarEstadoCuenta,
  crearCuentaEnEquipo,
} from '@/lib/db/queries/usuarios';
import { cambiarEstadoSchema, crearCuentaSchema } from '@/lib/validations/cuentas';

export const crearCuenta = crearAction({
  schema: crearCuentaSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    const email = input.email.trim().toLowerCase();

    if (await buscarPorEmail(email)) {
      throw new ErrorNegocio('Ya existe una cuenta con ese email.');
    }

    const { id } = await crearCuentaEnEquipo(
      { email, nombre: input.nombre.trim(), rol: input.rol },
      actor,
    );

    // Invitación: reutiliza el flujo de reset (1.2). El usuario define su
    // contraseña en /reset-password. En dev sin RESEND_API_KEY es no-op.
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/reset-password' },
    });

    revalidatePath('/admin/equipo');
    return { id };
  },
});

export const desactivarCuenta = crearAction({
  schema: cambiarEstadoSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    if (input.userId === actor.id) {
      throw new ErrorNegocio('No puedes desactivar tu propia cuenta.');
    }
    await cambiarEstadoCuenta(input.userId, 'inactivo', actor);
    revalidatePath('/admin/equipo');
    return { ok: true };
  },
});

export const reactivarCuenta = crearAction({
  schema: cambiarEstadoSchema,
  roles: ['admin'],
  handler: async (input, actor) => {
    await cambiarEstadoCuenta(input.userId, 'activo', actor);
    revalidatePath('/admin/equipo');
    return { ok: true };
  },
});
