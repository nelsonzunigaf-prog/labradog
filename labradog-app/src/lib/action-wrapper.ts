/**
 * Wrapper estándar de Server Action — TODA action del proyecto se crea con esto.
 *
 * Encarna el proceso de mutación de la arquitectura:
 *   validar Zod → verificar rol → ejecutar handler (que orquesta motor + BD +
 *   auditoría) → la action llama revalidatePath según corresponda.
 *
 * Contrato: SIEMPRE retorna { ok: true, data } | { ok: false, error } —
 * nunca lanza excepciones hacia la UI.
 *
 * Uso:
 *   export const crearTutor = crearAction({
 *     schema: tutorSchema,        // Zod, desde src/lib/validations/
 *     roles: ['admin'],
 *     handler: async (input, actor) => { ... },
 *   });
 */
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { getActor, type ActorSesion, type Rol } from './actor';

export type ResultadoAction<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Error de negocio ESPERADO (regla violada, no un bug): su mensaje SÍ se muestra
 * al usuario. Lánzalo desde un handler para devolver `{ ok: false, error }` con
 * un mensaje propio. Los errores que NO son ErrorNegocio se tratan como
 * inesperados: se reportan a Sentry y la UI recibe un mensaje genérico.
 */
export class ErrorNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}

export function crearAction<S extends z.ZodType, T>(opciones: {
  schema: S;
  roles: Rol[];
  handler: (input: z.infer<S>, actor: ActorSesion) => Promise<T>;
}): (input: unknown) => Promise<ResultadoAction<T>> {
  const { schema, roles, handler } = opciones;

  return async (input: unknown): Promise<ResultadoAction<T>> => {
    try {
      // 1. Validar entrada
      const parseado = schema.safeParse(input);
      if (!parseado.success) {
        const primerError = parseado.error.issues[0];
        if (!primerError) {
          return { ok: false, error: 'Datos inválidos' };
        }
        const campo = primerError.path.join('.');
        return {
          ok: false,
          error: campo
            ? `Datos inválidos en "${campo}": ${primerError.message}`
            : `Datos inválidos: ${primerError.message}`,
        };
      }

      // 2. Verificar sesión y rol
      const actor = await getActor();
      if (!actor) {
        return { ok: false, error: 'No autenticado' };
      }
      if (!roles.includes(actor.rol)) {
        return { ok: false, error: 'No autorizado' };
      }

      // 3. Ejecutar la lógica (motor + escritura + auditoría)
      const data = await handler(parseado.data, actor);
      return { ok: true, data };
    } catch (error) {
      // Errores de negocio esperados: su mensaje se muestra tal cual (no es bug).
      if (error instanceof ErrorNegocio) {
        return { ok: false, error: error.message };
      }
      // Los errores inesperados se reportan a Sentry (no-op sin DSN),
      // pero la UI siempre recibe un resultado tipado.
      Sentry.captureException(error);
      console.error('[action-wrapper] error inesperado:', error);
      return {
        ok: false,
        error: 'Ocurrió un error inesperado. Intenta de nuevo.',
      };
    }
  };
}
