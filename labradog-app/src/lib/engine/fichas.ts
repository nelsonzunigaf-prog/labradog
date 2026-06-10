/**
 * Reglas de negocio puras de fichas — motor sin I/O (regla #2 de capas).
 *
 * Por ahora: la taxonomía de red flags del tutor (etapa 7 del método) y la regla
 * "2+ red flags → sugerir rechazo del servicio" (FR-005). La tupla
 * `RED_FLAGS_TUTOR` es la fuente única de verdad: alimenta el `pgEnum`
 * `red_flag_tutor` del schema y el `z.enum` de validaciones (mismo patrón que
 * `ESTADOS_PASEO` en paseo-estados.ts), evitando desincronización BD ↔ TS.
 */

/** Conductas de alerta detectables en la entrevista inicial (taxonomía etapa 7). */
export const RED_FLAGS_TUTOR = [
  'minimiza_conductas',
  'insiste_soltar_correa',
  'presiona_tiempo',
  'oculta_informacion',
  'desautoriza_criterio',
  'rechaza_protocolos',
] as const;

export type RedFlagTutor = (typeof RED_FLAGS_TUTOR)[number];

/** Texto humano de cada red flag para la UI. */
export const ETIQUETAS_RED_FLAG: Record<RedFlagTutor, string> = {
  minimiza_conductas: 'Minimiza conductas problemáticas',
  insiste_soltar_correa: 'Insiste en soltar la correa',
  presiona_tiempo: 'Presiona por tiempo',
  oculta_informacion: 'Oculta información',
  desautoriza_criterio: 'Desautoriza el criterio profesional',
  rechaza_protocolos: 'Rechaza los protocolos',
};

/**
 * Evalúa las red flags marcadas. Función PURA.
 * @returns `cantidad` de red flags únicas y `sugerirRechazo` (true con 2+).
 */
export function evaluarRedFlags(redFlags: RedFlagTutor[]): {
  cantidad: number;
  sugerirRechazo: boolean;
} {
  const cantidad = new Set(redFlags).size;
  return { cantidad, sugerirRechazo: cantidad >= 2 };
}
