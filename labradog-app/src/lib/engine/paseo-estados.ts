/**
 * Máquina de estados del paseo — artefacto ÚNICO y PURO (sin I/O).
 *
 * Consumido por 3.x (agenda/materialización), 4.x (registro en calle) y 5.x
 * (cobros/liquidaciones). La tupla `ESTADOS_PASEO` es la fuente única de verdad:
 * el `pgEnum('estado_paseo', ESTADOS_PASEO)` del schema la importa para que el
 * enum de BD y el tipo TS no se desincronicen.
 *
 * Este motor solo valida que una TRANSICIÓN sea legal. Las guardas de negocio
 * (¿checklist completa?, ¿hora válida?, ¿paseador certificado?) viven en la capa
 * de actions de las stories consumidoras (4.x), NUNCA aquí (regla #2/#3 de capas).
 */

/** Estados del ciclo de vida de un paseo. Orden = avance del flujo feliz. */
export const ESTADOS_PASEO = [
  'pendiente',
  'checklist_completa',
  'en_curso',
  'completado',
  'cancelado',
] as const;

export type EstadoPaseo = (typeof ESTADOS_PASEO)[number];

/**
 * Transiciones permitidas. Flujo feliz:
 *   pendiente → checklist_completa → en_curso → completado
 * Cancelar se permite desde cualquier estado NO terminal (un incidente puede
 * abortar un paseo en curso). `completado` y `cancelado` son terminales.
 */
export const TRANSICIONES: Record<EstadoPaseo, readonly EstadoPaseo[]> = {
  pendiente: ['checklist_completa', 'cancelado'],
  checklist_completa: ['en_curso', 'cancelado'],
  en_curso: ['completado', 'cancelado'],
  completado: [],
  cancelado: [],
};

/** `true` si el estado no admite más transiciones (completado | cancelado). */
export function esTerminal(estado: EstadoPaseo): boolean {
  return TRANSICIONES[estado].length === 0;
}

/** `true` si `desde → hacia` es una transición legal. Función pura. */
export function puedeTransicionar(desde: EstadoPaseo, hacia: EstadoPaseo): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/**
 * Devuelve `hacia` si la transición es legal; si no, lanza `Error`.
 *
 * Lanza un `Error` plano (no `ErrorNegocio`): el motor es puro y no depende de
 * la capa de actions. La action consumidora captura y traduce a `{ok:false}`.
 */
export function transicionar(desde: EstadoPaseo, hacia: EstadoPaseo): EstadoPaseo {
  if (!puedeTransicionar(desde, hacia)) {
    throw new Error(`Transición inválida: ${desde} → ${hacia}`);
  }
  return hacia;
}
