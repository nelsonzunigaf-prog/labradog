/**
 * Validaciones Zod de cuentas del equipo (Story 1.3) — compartidas cliente y
 * servidor. El servidor SIEMPRE valida (regla #11); la UI valida solo para UX.
 */
import { z } from 'zod';

export const crearCuentaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['admin', 'paseador']),
});

export type CrearCuentaInput = z.infer<typeof crearCuentaSchema>;

export const cambiarEstadoSchema = z.object({
  userId: z.string().min(1),
});

export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
