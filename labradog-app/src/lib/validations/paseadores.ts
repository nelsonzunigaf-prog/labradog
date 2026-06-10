/**
 * Validaciones Zod compartidas de la ficha del paseador (Story 1.7).
 * El servidor SIEMPRE valida (regla #11); la UI reusa estos schemas.
 */
import { z } from 'zod';
import { ESPECIALIDADES_CAMINATA } from '@/lib/engine/fichas';

export const fichaPaseadorSchema = z.object({
  userId: z.string().min(1),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  especialidades: z.array(z.enum(ESPECIALIDADES_CAMINATA)).default([]),
  comisionPct: z
    .number()
    .int('La comisión debe ser un entero')
    .min(60, 'La comisión va de 60 a 80')
    .max(80, 'La comisión va de 60 a 80'),
  notas: z.string().optional(),
});

export type FichaPaseadorInput = z.infer<typeof fichaPaseadorSchema>;

export const actualizarFichaPaseadorSchema = fichaPaseadorSchema.omit({ userId: true }).extend({
  id: z.string().uuid(),
  version: z.number().int().nonnegative(),
});

export type ActualizarFichaPaseadorInput = z.infer<typeof actualizarFichaPaseadorSchema>;
