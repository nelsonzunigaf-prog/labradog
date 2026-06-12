/**
 * Motor de reglas de capacitación/certificación — PATRÓN ENGINE del Epic 2
 * (Story 2.2). Funciones PURAS sin I/O (regla #2 de capas): trabajan con
 * NÚMEROS de etapa (1-10, donde 10 = módulo razas, convención de 2.1); la capa
 * de queries traduce uuids ↔ números y SIEMPRE delega aquí — la regla de
 * desbloqueo jamás se reimplementa en Actions, queries ni componentes.
 *
 * Las stories siguientes EXTIENDEN este archivo: 2.3 (scoring 80% exacto),
 * 2.5 (examen final), 2.6 (gate de certificación para asignar paseos).
 */

export type EstadoEtapa = 'aprobada' | 'actual' | 'bloqueada';

/**
 * Regla de desbloqueo secuencial (FR-011): ordenadas por numero, cada etapa
 * aprobada se muestra 'aprobada'; la PRIMERA no aprobada es la 'actual' (única
 * abierta para estudiar); el resto queda 'bloqueada'. Con huecos (p.ej. {1,3})
 * la 2 es la actual y la 3 conserva su aprobación. El módulo razas (numero 10)
 * cae en la regla general: se abre al aprobar la 9.
 */
export function calcularEstadosEtapas(
  numeros: number[],
  aprobados: ReadonlySet<number>,
): Array<{ numero: number; estado: EstadoEtapa }> {
  const ordenados = [...numeros].sort((a, b) => a - b);
  let actualAsignada = false;
  return ordenados.map((numero) => {
    if (aprobados.has(numero)) return { numero, estado: 'aprobada' as const };
    if (!actualAsignada) {
      actualAsignada = true;
      return { numero, estado: 'actual' as const };
    }
    return { numero, estado: 'bloqueada' as const };
  });
}

/**
 * Gate de acceso al contenido: una etapa se puede abrir si está aprobada o si
 * es la actual (la primera no aprobada). Misma regla que calcularEstadosEtapas,
 * sin duplicarla: aprobada, o ninguna etapa anterior pendiente.
 */
export function puedeAbrirEtapa(numero: number, aprobados: ReadonlySet<number>): boolean {
  if (aprobados.has(numero)) return true;
  for (let n = 1; n < numero; n++) {
    if (!aprobados.has(n)) return false;
  }
  return true;
}

/** Avance del programa: etapas aprobadas sobre el total. */
export function calcularAvance(
  aprobados: ReadonlySet<number>,
  totalEtapas: number,
): { aprobadas: number; total: number } {
  return { aprobadas: aprobados.size, total: totalEtapas };
}
