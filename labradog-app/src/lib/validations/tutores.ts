/**
 * Validaciones Zod compartidas de la ficha del tutor (Story 1.5).
 * El servidor SIEMPRE valida (regla #11); la UI reusa estos schemas.
 */
import { z } from 'zod';
import { RED_FLAGS_TUTOR } from '@/lib/engine/fichas';

export const crearTutorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  direccionRetiro: z.string().min(1, 'La dirección de retiro es obligatoria'),
  planDefault: z.enum(['base', 'plus', 'elite']),
  cobroPeriodicidad: z.enum(['por_paseo', 'semanal', 'mensual']),
  cobroTiempo: z.enum(['prepago', 'postpago']),
  estado: z.enum(['activo', 'pausado', 'cerrado']).default('activo'),
});

export type CrearTutorInput = z.infer<typeof crearTutorSchema>;

export const actualizarTutorSchema = crearTutorSchema.extend({
  id: z.string().uuid(),
  version: z.number().int().nonnegative(),
});

export type ActualizarTutorInput = z.infer<typeof actualizarTutorSchema>;

export const entrevistaSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().nonnegative(),
  historial: z.string().optional(),
  reactividad: z.string().optional(),
  escapes: z.string().optional(),
  equipamiento: z.string().optional(),
  expectativas: z.string().optional(),
  redFlags: z.array(z.enum(RED_FLAGS_TUTOR)).default([]),
});

export type EntrevistaInput = z.infer<typeof entrevistaSchema>;

export const anexoSchema = z.object({
  tutorId: z.string().uuid(),
  tipo: z.enum(['limites_servicio', 'compromiso_etico']),
  fechaAceptacion: z.string().min(1, 'La fecha es obligatoria'),
  medio: z.enum(['papel', 'pdf']),
  pdfKey: z.string().optional(),
});

export type AnexoInput = z.infer<typeof anexoSchema>;
