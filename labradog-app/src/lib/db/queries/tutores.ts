/**
 * Queries de la ficha del tutor (Story 1.5) — ÚNICO lugar que ejecuta SQL para
 * tutores y sus anexos (regla #2 de capas).
 *
 * Auditoría: created_by/updated_by se setean con actor.id (...columnasAuditoria).
 * Las fichas NO escriben event_log (no son operación sensible).
 *
 * Lock optimista (regla #9): actualizar/registrar exigen la `version` esperada en
 * el WHERE; si nadie coincide (otro admin cambió la fila antes) se retorna `null`
 * y la action lo traduce a ErrorNegocio("Este registro cambió, recarga").
 */
import { and, eq, sql } from 'drizzle-orm';
import type { ActorSesion } from '../../actor';
import { db } from '../index';
import { anexosTutor, tutores } from '../schema';
import type {
  ActualizarTutorInput,
  AnexoInput,
  CrearTutorInput,
  EntrevistaInput,
} from '../../validations/tutores';

export type TutorListado = {
  id: string;
  nombre: string;
  telefono: string;
  planDefault: string;
  estado: string;
};

export type TutorFila = typeof tutores.$inferSelect;
export type AnexoTutor = typeof anexosTutor.$inferSelect;
export type TutorFicha = TutorFila & { anexos: AnexoTutor[] };

/** Listado para la tabla admin. */
export async function listarTutores(): Promise<TutorListado[]> {
  return db
    .select({
      id: tutores.id,
      nombre: tutores.nombre,
      telefono: tutores.telefono,
      planDefault: tutores.planDefault,
      estado: tutores.estado,
    })
    .from(tutores)
    .orderBy(tutores.nombre);
}

/** Ficha completa + sus anexos. `null` si no existe. */
export async function obtenerTutor(id: string): Promise<TutorFicha | null> {
  const [tutor] = await db.select().from(tutores).where(eq(tutores.id, id));
  if (!tutor) return null;

  const anexos = await db
    .select()
    .from(anexosTutor)
    .where(eq(anexosTutor.tutorId, id))
    .orderBy(anexosTutor.tipo);

  return { ...tutor, anexos };
}

/** Crea una ficha de tutor. created_by/updated_by = actor.id. */
export async function crearTutor(
  datos: CrearTutorInput,
  actor: ActorSesion,
): Promise<{ id: string }> {
  const [fila] = await db
    .insert(tutores)
    .values({
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email || null,
      direccionRetiro: datos.direccionRetiro,
      planDefault: datos.planDefault,
      cobroPeriodicidad: datos.cobroPeriodicidad,
      cobroTiempo: datos.cobroTiempo,
      estado: datos.estado,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: tutores.id });

  return { id: fila!.id };
}

/**
 * Actualiza la ficha con lock optimista. Retorna el id o `null` si la `version`
 * ya no coincide (otro admin la cambió) o el tutor no existe.
 */
export async function actualizarTutor(
  datos: ActualizarTutorInput,
  actor: ActorSesion,
): Promise<{ id: string } | null> {
  const filas = await db
    .update(tutores)
    .set({
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email || null,
      direccionRetiro: datos.direccionRetiro,
      planDefault: datos.planDefault,
      cobroPeriodicidad: datos.cobroPeriodicidad,
      cobroTiempo: datos.cobroTiempo,
      estado: datos.estado,
      updatedBy: actor.id,
      updatedAt: new Date(),
      version: sql`${tutores.version} + 1`,
    })
    .where(and(eq(tutores.id, datos.id), eq(tutores.version, datos.version)))
    .returning({ id: tutores.id });

  return filas[0] ?? null;
}

/**
 * Registra/edita la entrevista inicial con lock optimista.
 * Retorna el id o `null` si la `version` ya no coincide.
 */
export async function registrarEntrevista(
  datos: EntrevistaInput,
  actor: ActorSesion,
): Promise<{ id: string } | null> {
  const filas = await db
    .update(tutores)
    .set({
      entrevistaHistorial: datos.historial ?? null,
      entrevistaReactividad: datos.reactividad ?? null,
      entrevistaEscapes: datos.escapes ?? null,
      entrevistaEquipamiento: datos.equipamiento ?? null,
      entrevistaExpectativas: datos.expectativas ?? null,
      redFlags: datos.redFlags,
      entrevistaRegistradaAt: new Date(),
      updatedBy: actor.id,
      updatedAt: new Date(),
      version: sql`${tutores.version} + 1`,
    })
    .where(and(eq(tutores.id, datos.id), eq(tutores.version, datos.version)))
    .returning({ id: tutores.id });

  return filas[0] ?? null;
}

/** Registra (o actualiza, upsert por tutor+tipo) la aceptación de un anexo legal. */
export async function registrarAnexo(datos: AnexoInput, actor: ActorSesion): Promise<void> {
  await db
    .insert(anexosTutor)
    .values({
      tutorId: datos.tutorId,
      tipo: datos.tipo,
      fechaAceptacion: datos.fechaAceptacion,
      medio: datos.medio,
      pdfKey: datos.pdfKey ?? null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .onConflictDoUpdate({
      target: [anexosTutor.tutorId, anexosTutor.tipo],
      set: {
        fechaAceptacion: datos.fechaAceptacion,
        medio: datos.medio,
        pdfKey: datos.pdfKey ?? null,
        updatedBy: actor.id,
        updatedAt: new Date(),
      },
    });
}
