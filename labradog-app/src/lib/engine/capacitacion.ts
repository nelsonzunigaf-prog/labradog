/**
 * Catálogo puro del programa de capacitación — motor sin I/O (regla #2 de capas).
 *
 * SOLO catálogo (Story 2.1): la tupla `TIPOS_EVALUACION` es la fuente única de
 * verdad que alimenta el `pgEnum` `tipo_evaluacion` del schema (mismo patrón que
 * ESTADOS_PASEO y ESPECIALIDADES_CAMINATA). Las REGLAS de capacitación
 * (desbloqueo secuencial, scoring 80% exacto, gate de certificación) NO viven
 * aquí: llegan en `certificacion.ts` con las stories 2.2/2.3/2.6.
 */

/** Cómo se evalúa cada etapa del programa (FR-012/014/013). */
export const TIPOS_EVALUACION = ['test', 'practica', 'test_y_practica', 'examen_final'] as const;

export type TipoEvaluacion = (typeof TIPOS_EVALUACION)[number];

/** Texto humano de cada tipo de evaluación para la UI. */
export const ETIQUETAS_TIPO_EVALUACION: Record<TipoEvaluacion, string> = {
  test: 'Test',
  practica: 'Evaluación práctica',
  test_y_practica: 'Test + práctica',
  examen_final: 'Examen final',
};
