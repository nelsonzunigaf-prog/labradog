/**
 * Fechas y zona horaria — utilidad CENTRAL del proyecto.
 *
 * Regla #6 (project-context): la BD guarda instantes en UTC (timestamptz); el
 * cálculo de agenda recurrente y el render se hacen en `America/Santiago`.
 *
 * Chile alterna horario de verano (UTC−3) e invierno (UTC−4) con 2 cambios al
 * año, así que NUNCA se suman offsets fijos: `TZDate` (de @date-fns/tz) interpreta
 * los componentes wall-clock en la zona IANA y deja que la base tz resuelva el
 * offset correcto por instante (inmune a DST). Esto es lo que la materialización
 * de paseos (Story 3.2) necesita: hora local → instante UTC por ocurrencia.
 */
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

export const ZONA = 'America/Santiago';

/** Formateador ISO `YYYY-MM-DD` de la fecha local Santiago (en-CA da ese formato). */
const FORMATEADOR_FECHA_LOCAL = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Convierte una fecha (y hora opcional) en horario de Santiago al instante UTC
 * correcto, inmune a DST.
 *
 * @param fechaLocal `'YYYY-MM-DD'` interpretada en `America/Santiago`.
 * @param hora `'HH:mm'` (default `'00:00'`).
 * @returns `Date` (instante UTC).
 */
export function aInstanteUtc(fechaLocal: string, hora = '00:00'): Date {
  const partesFecha = fechaLocal.split('-').map(Number);
  const partesHora = hora.split(':').map(Number);

  // Exigir exactamente YYYY-MM-DD y HH:mm: partes extra (p.ej. 'HH:mm:ss' o un
  // ISO con 'T') se rechazan en vez de descartarse en silencio.
  if (partesFecha.length !== 3 || partesHora.length !== 2) {
    throw new Error(`Formato esperado YYYY-MM-DD y HH:mm: "${fechaLocal}" "${hora}"`);
  }

  const [anio, mes, dia] = partesFecha;
  const [h, min] = partesHora;

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    !Number.isInteger(h) ||
    !Number.isInteger(min)
  ) {
    throw new Error(`Fecha u hora inválida: "${fechaLocal}" "${hora}"`);
  }

  // TZDate interpreta los componentes en ZONA (mes 0-based) y resuelve el offset.
  const tz = new TZDate(anio, mes - 1, dia, h, min, 0, 0, ZONA);
  // Devolvemos un Date plano con el mismo instante UTC (desacopla del tipo TZDate).
  return new Date(tz.getTime());
}

/**
 * Fecha local Santiago (`'YYYY-MM-DD'`) de un instante UTC. Útil para calcular
 * `paseos.fecha_local` y la unique `(recurrencia_id, fecha_local)` de la
 * materialización idempotente.
 */
export function aFechaLocal(instante: Date): string {
  return FORMATEADOR_FECHA_LOCAL.format(instante);
}

/**
 * Render legible en hora de Santiago para la UI.
 * @param formato patrón date-fns (default `'dd-MM-yyyy HH:mm'`).
 */
export function formatearLocal(instante: Date, formato = 'dd-MM-yyyy HH:mm'): string {
  return format(new TZDate(instante, ZONA), formato);
}

/**
 * Feriados legales de Chile, mapa `'YYYY-MM-DD' → nombre`.
 *
 * Incluye los feriados móviles ya resueltos por año (no se computa Pascua).
 * DEUDA TÉCNICA: extender esta tabla cada año. El motor de recurrencia (3.x)
 * la consume para flag/omisión de fechas.
 */
export const FERIADOS_CL: Record<string, string> = {
  // 2026
  '2026-01-01': 'Año Nuevo',
  '2026-04-03': 'Viernes Santo',
  '2026-04-04': 'Sábado Santo',
  '2026-05-01': 'Día Nacional del Trabajo',
  '2026-05-21': 'Día de las Glorias Navales',
  '2026-06-20': 'Día Nacional de los Pueblos Indígenas',
  '2026-06-29': 'San Pedro y San Pablo',
  '2026-07-16': 'Día de la Virgen del Carmen',
  '2026-08-15': 'Asunción de la Virgen',
  '2026-09-18': 'Independencia Nacional',
  '2026-09-19': 'Día de las Glorias del Ejército',
  '2026-10-12': 'Encuentro de Dos Mundos',
  '2026-10-31': 'Día de las Iglesias Evangélicas y Protestantes',
  '2026-11-01': 'Día de Todos los Santos',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
  // 2027
  '2027-01-01': 'Año Nuevo',
  '2027-03-26': 'Viernes Santo',
  '2027-03-27': 'Sábado Santo',
  '2027-05-01': 'Día Nacional del Trabajo',
  '2027-05-21': 'Día de las Glorias Navales',
  '2027-06-21': 'Día Nacional de los Pueblos Indígenas',
  '2027-06-28': 'San Pedro y San Pablo',
  '2027-07-16': 'Día de la Virgen del Carmen',
  '2027-08-15': 'Asunción de la Virgen',
  '2027-09-18': 'Independencia Nacional',
  '2027-09-19': 'Día de las Glorias del Ejército',
  '2027-10-11': 'Encuentro de Dos Mundos',
  '2027-10-31': 'Día de las Iglesias Evangélicas y Protestantes',
  '2027-11-01': 'Día de Todos los Santos',
  '2027-12-08': 'Inmaculada Concepción',
  '2027-12-25': 'Navidad',
};

/** `true` si la fecha local Santiago (`'YYYY-MM-DD'`) es feriado de Chile. */
export function esFeriado(fechaLocal: string): boolean {
  return fechaLocal in FERIADOS_CL;
}
