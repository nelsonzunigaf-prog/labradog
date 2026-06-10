/**
 * Validaciones Zod compartidas de la ficha del perro (Story 1.6).
 * El servidor SIEMPRE valida (regla #11); la UI reusa estos schemas.
 */
import { z } from 'zod';

export const crearPerroSchema = z.object({
  tutorId: z.string().uuid(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  raza: z.string().min(1, 'La raza es obligatoria'),
  grupoRaza: z.enum(['trabajo_guardia', 'pastora', 'caza', 'otro']),
  edad: z.number().int().min(0, 'Edad inválida').max(30, 'Edad inválida').optional(),
  talla: z.enum(['pequena', 'mediana', 'grande']),
  condicionFisica: z.string().optional(),
  temperamento: z.string().optional(),
  equipamiento: z.string().optional(),
  premiosAceptados: z.string().optional(),
  notasManejo: z.string().optional(),
  notasCriticas: z.boolean().default(false),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

export type CrearPerroInput = z.infer<typeof crearPerroSchema>;

// El perro no cambia de tutor en v1 (por eso se omite tutorId al editar).
export const actualizarPerroSchema = crearPerroSchema.omit({ tutorId: true }).extend({
  id: z.string().uuid(),
  version: z.number().int().nonnegative(),
});

export type ActualizarPerroInput = z.infer<typeof actualizarPerroSchema>;

export const compatibilidadSchema = z
  .object({
    perroAId: z.string().uuid(),
    perroBId: z.string().uuid(),
  })
  .refine((d) => d.perroAId !== d.perroBId, {
    message: 'Un perro no puede ser compatible consigo mismo',
  });

export type CompatibilidadInput = z.infer<typeof compatibilidadSchema>;
