/**
 * Queries de la ficha del perro (Story 1.6) — ÚNICO lugar que ejecuta SQL para
 * perros y sus compatibilidades (regla #2 de capas).
 *
 * Compatibilidades (FR-008): UNA fila por par canónico (perro_menor_id <
 * perro_mayor_id, orden lexicográfico de uuid) — la bidireccionalidad se
 * resuelve en la LECTURA buscando el id en ambas columnas. Solo entre perros
 * del MISMO tutor (regla del plan BASE; el gate de ratio vive en 3.x).
 *
 * Lock optimista (regla #9): mismo patrón de queries/tutores.ts — conflicto
 * retorna `null` y la action lo traduce a ErrorNegocio.
 */
import { and, eq, or, sql } from 'drizzle-orm';
import type { ActorSesion } from '../../actor';
import { db } from '../index';
import { perroCompatibilidades, perros, tutores } from '../schema';
import type { ActualizarPerroInput, CrearPerroInput } from '../../validations/perros';

export type PerroListado = {
  id: string;
  nombre: string;
  raza: string;
  grupoRaza: string;
  talla: string;
  estado: string;
  fotoKey: string | null;
  notasCriticas: boolean;
};

export type PerroFila = typeof perros.$inferSelect;
export type CompatibilidadPerro = { otroPerroId: string; otroPerroNombre: string };
export type PerroFicha = PerroFila & {
  tutorNombre: string;
  compatibilidades: CompatibilidadPerro[];
};

/** Error tipado de la regla "mismo tutor" — la action lo traduce a ErrorNegocio. */
export class ErrorDistintoTutor extends Error {
  constructor() {
    super('Los perros pertenecen a tutores distintos');
    this.name = 'ErrorDistintoTutor';
  }
}

/** Perros de un tutor (sección Perros de la ficha del tutor). */
export async function listarPerrosDeTutor(tutorId: string): Promise<PerroListado[]> {
  return db
    .select({
      id: perros.id,
      nombre: perros.nombre,
      raza: perros.raza,
      grupoRaza: perros.grupoRaza,
      talla: perros.talla,
      estado: perros.estado,
      fotoKey: perros.fotoKey,
      notasCriticas: perros.notasCriticas,
    })
    .from(perros)
    .where(eq(perros.tutorId, tutorId))
    .orderBy(perros.nombre);
}

/** Ficha completa + nombre del tutor + compatibilidades resueltas. `null` si no existe. */
export async function obtenerPerro(id: string): Promise<PerroFicha | null> {
  const [fila] = await db
    .select({ perro: perros, tutorNombre: tutores.nombre })
    .from(perros)
    .innerJoin(tutores, eq(perros.tutorId, tutores.id))
    .where(eq(perros.id, id));
  if (!fila) return null;

  const compatibilidades = await listarCompatibilidadesDePerro(id);
  return { ...fila.perro, tutorNombre: fila.tutorNombre, compatibilidades };
}

/** Crea la ficha del perro. created_by/updated_by = actor.id. */
export async function crearPerro(
  datos: CrearPerroInput,
  actor: ActorSesion,
): Promise<{ id: string }> {
  const [fila] = await db
    .insert(perros)
    .values({
      tutorId: datos.tutorId,
      nombre: datos.nombre,
      raza: datos.raza,
      grupoRaza: datos.grupoRaza,
      edad: datos.edad ?? null,
      talla: datos.talla,
      condicionFisica: datos.condicionFisica || null,
      temperamento: datos.temperamento || null,
      equipamiento: datos.equipamiento || null,
      premiosAceptados: datos.premiosAceptados || null,
      notasManejo: datos.notasManejo || null,
      notasCriticas: datos.notasCriticas,
      estado: datos.estado,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: perros.id });

  return { id: fila!.id };
}

/**
 * Actualiza la ficha con lock optimista. Retorna el id o `null` si la `version`
 * ya no coincide (otro admin la cambió) o el perro no existe.
 */
export async function actualizarPerro(
  datos: ActualizarPerroInput,
  actor: ActorSesion,
): Promise<{ id: string } | null> {
  const filas = await db
    .update(perros)
    .set({
      nombre: datos.nombre,
      raza: datos.raza,
      grupoRaza: datos.grupoRaza,
      edad: datos.edad ?? null,
      talla: datos.talla,
      condicionFisica: datos.condicionFisica || null,
      temperamento: datos.temperamento || null,
      equipamiento: datos.equipamiento || null,
      premiosAceptados: datos.premiosAceptados || null,
      notasManejo: datos.notasManejo || null,
      notasCriticas: datos.notasCriticas,
      estado: datos.estado,
      updatedBy: actor.id,
      updatedAt: new Date(),
      version: sql`${perros.version} + 1`,
    })
    .where(and(eq(perros.id, datos.id), eq(perros.version, datos.version)))
    .returning({ id: perros.id });

  return filas[0] ?? null;
}

/**
 * Persiste la key de la foto (subida vía storage.ts). Update simple SIN version:
 * no es edición concurrente de campos de negocio (la key es estable por perro).
 */
export async function actualizarFotoPerro(
  perroId: string,
  fotoKey: string,
  actor: ActorSesion,
): Promise<void> {
  await db
    .update(perros)
    .set({ fotoKey, updatedBy: actor.id, updatedAt: new Date() })
    .where(eq(perros.id, perroId));
}

/** Normaliza un par de ids al orden canónico (menor, mayor) lexicográfico. */
function parCanonico(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Marca compatibilidad entre dos perros del MISMO tutor. Idempotente
 * (onConflictDoNothing sobre el par canónico). Lanza ErrorDistintoTutor si los
 * perros no comparten tutor.
 */
export async function marcarCompatibilidad(
  datos: { perroAId: string; perroBId: string },
  actor: ActorSesion,
): Promise<void> {
  const filas = await db
    .select({ id: perros.id, tutorId: perros.tutorId })
    .from(perros)
    .where(or(eq(perros.id, datos.perroAId), eq(perros.id, datos.perroBId)));

  if (filas.length !== 2) {
    throw new Error('Alguno de los perros no existe');
  }
  if (filas[0]!.tutorId !== filas[1]!.tutorId) {
    throw new ErrorDistintoTutor();
  }

  const [menor, mayor] = parCanonico(datos.perroAId, datos.perroBId);
  await db
    .insert(perroCompatibilidades)
    .values({
      perroMenorId: menor,
      perroMayorId: mayor,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .onConflictDoNothing({
      target: [perroCompatibilidades.perroMenorId, perroCompatibilidades.perroMayorId],
    });
}

/**
 * Quita la compatibilidad de un par. DELETE físico justificado: es una relación
 * operativa re-evaluable (los perros cambian), NO un dato de negocio histórico —
 * la regla #8 (soft-delete) protege fichas y hechos económicos, no esta relación.
 */
export async function quitarCompatibilidad(datos: {
  perroAId: string;
  perroBId: string;
}): Promise<void> {
  const [menor, mayor] = parCanonico(datos.perroAId, datos.perroBId);
  await db
    .delete(perroCompatibilidades)
    .where(
      and(
        eq(perroCompatibilidades.perroMenorId, menor),
        eq(perroCompatibilidades.perroMayorId, mayor),
      ),
    );
}

/**
 * Compatibilidades de un perro, resueltas al OTRO perro de cada par
 * (bidireccionalidad por lectura: busca el id en ambas columnas).
 */
export async function listarCompatibilidadesDePerro(
  perroId: string,
): Promise<CompatibilidadPerro[]> {
  const pares = await db
    .select({
      perroMenorId: perroCompatibilidades.perroMenorId,
      perroMayorId: perroCompatibilidades.perroMayorId,
    })
    .from(perroCompatibilidades)
    .where(
      or(
        eq(perroCompatibilidades.perroMenorId, perroId),
        eq(perroCompatibilidades.perroMayorId, perroId),
      ),
    );

  if (pares.length === 0) return [];

  const otrosIds = pares.map((p) => (p.perroMenorId === perroId ? p.perroMayorId : p.perroMenorId));
  const otros = await db
    .select({ id: perros.id, nombre: perros.nombre })
    .from(perros)
    .where(or(...otrosIds.map((id) => eq(perros.id, id))));

  const nombrePorId = new Map(otros.map((o) => [o.id, o.nombre]));
  return otrosIds.map((id) => ({
    otroPerroId: id,
    otroPerroNombre: nombrePorId.get(id) ?? '(desconocido)',
  }));
}
