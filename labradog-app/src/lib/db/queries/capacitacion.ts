/**
 * Queries de capacitación del paseador (Story 2.2) — ÚNICO lugar que ejecuta
 * SQL de capacitación (regla #2 de capas). SOLO lectura: las aprobaciones las
 * escriben 2.3 (tests), 2.4 (prácticas) y 2.5 (examen).
 *
 * La REGLA de desbloqueo vive en lib/engine/certificacion.ts (regla #3):
 * estas queries traducen uuids ↔ números de etapa y DELEGAN al motor. El gate
 * de contenido es de SERVIDOR: una etapa bloqueada jamás incluye contenido_md
 * en la respuesta (AC5).
 */
import { eq } from 'drizzle-orm';
import {
  calcularAvance,
  calcularEstadosEtapas,
  puedeAbrirEtapa,
  type EstadoEtapa,
} from '../../engine/certificacion';
import { db } from '../index';
import { aprobacionesEtapa, etapas, paseadores } from '../schema';
import type { TipoEvaluacion } from '../../engine/capacitacion';

export type EtapaListada = {
  numero: number;
  slug: string;
  titulo: string;
  modulo: string;
  duracion: string;
  tipoEvaluacion: TipoEvaluacion;
  esModuloRazas: boolean;
  estado: EstadoEtapa;
};

export type CapacitacionPaseador = {
  etapas: EtapaListada[];
  avance: { aprobadas: number; total: number };
};

export type EtapaVisible =
  | {
      bloqueada: false;
      numero: number;
      slug: string;
      titulo: string;
      modulo: string;
      duracion: string;
      esModuloRazas: boolean;
      estado: EstadoEtapa;
      contenidoMd: string;
    }
  | { bloqueada: true; numero: number; titulo: string };

/** Id de la ficha del paseador para una cuenta, o null si no tiene ficha. */
async function obtenerFichaId(userId: string): Promise<string | null> {
  const filas = await db
    .select({ id: paseadores.id })
    .from(paseadores)
    .where(eq(paseadores.userId, userId));
  return filas[0]?.id ?? null;
}

/** Números de etapa aprobados por el paseador (traducción uuid → numero). */
async function obtenerNumerosAprobados(paseadorId: string): Promise<Set<number>> {
  const filas = await db
    .select({ numero: etapas.numero })
    .from(aprobacionesEtapa)
    .innerJoin(etapas, eq(aprobacionesEtapa.etapaId, etapas.id))
    .where(eq(aprobacionesEtapa.paseadorId, paseadorId));
  return new Set(filas.map((f) => f.numero));
}

/**
 * Vista "Mi capacitación": etapas con estado (vía motor) + avance.
 * `null` si la cuenta no tiene ficha de paseador (no está en capacitación).
 * La lista NO incluye contenido_md (no lo necesita y pesa).
 */
export async function obtenerCapacitacionParaUsuario(
  userId: string,
): Promise<CapacitacionPaseador | null> {
  const fichaId = await obtenerFichaId(userId);
  if (!fichaId) return null;

  const filas = await db
    .select({
      numero: etapas.numero,
      slug: etapas.slug,
      titulo: etapas.titulo,
      modulo: etapas.modulo,
      duracion: etapas.duracion,
      tipoEvaluacion: etapas.tipoEvaluacion,
      esModuloRazas: etapas.esModuloRazas,
    })
    .from(etapas)
    .orderBy(etapas.numero);

  const aprobados = await obtenerNumerosAprobados(fichaId);
  const estados = new Map(
    calcularEstadosEtapas(
      filas.map((f) => f.numero),
      aprobados,
    ).map((e) => [e.numero, e.estado]),
  );

  return {
    etapas: filas.map((f) => ({ ...f, estado: estados.get(f.numero) ?? 'bloqueada' })),
    avance: calcularAvance(aprobados, filas.length),
  };
}

/**
 * Detalle de una etapa para el paseador. El motor decide el acceso (AC5):
 * bloqueada → respuesta SIN contenido_md. `null` si no hay ficha o el slug
 * no existe.
 */
export async function obtenerEtapaParaUsuario(
  userId: string,
  slug: string,
): Promise<EtapaVisible | null> {
  const fichaId = await obtenerFichaId(userId);
  if (!fichaId) return null;

  const filas = await db
    .select({
      numero: etapas.numero,
      slug: etapas.slug,
      titulo: etapas.titulo,
      modulo: etapas.modulo,
      duracion: etapas.duracion,
      esModuloRazas: etapas.esModuloRazas,
      contenidoMd: etapas.contenidoMd,
    })
    .from(etapas)
    .where(eq(etapas.slug, slug));
  const etapa = filas[0];
  if (!etapa) return null;

  const aprobados = await obtenerNumerosAprobados(fichaId);
  if (!puedeAbrirEtapa(etapa.numero, aprobados)) {
    return { bloqueada: true, numero: etapa.numero, titulo: etapa.titulo };
  }

  return {
    bloqueada: false,
    ...etapa,
    estado: aprobados.has(etapa.numero) ? 'aprobada' : 'actual',
  };
}
