/**
 * Queries de la ficha del paseador (Story 1.7) — ÚNICO lugar que ejecuta SQL
 * para paseadores (regla #2 de capas).
 *
 * La ficha es 1:1 con la cuenta `user` rol paseador (Story 1.3): el listado
 * parte de las cuentas (left join) para mostrar también las que no tienen
 * ficha. Sin event_log: el % vigente no es operación sensible (la historia
 * económica la protege el snapshot por paseo; el override en liquidación de
 * 5.x sí será evento).
 */
import { and, eq, sql } from 'drizzle-orm';
import type { ActorSesion } from '../../actor';
import { db } from '../index';
import { paseadores, user } from '../schema';
import type {
  ActualizarFichaPaseadorInput,
  FichaPaseadorInput,
} from '../../validations/paseadores';

export type PaseadorListado = {
  userId: string;
  nombre: string;
  email: string;
  estadoCuenta: string;
  ficha: {
    id: string;
    telefono: string;
    especialidades: string[];
    comisionPct: number;
  } | null;
};

export type FichaPaseador = {
  cuenta: { userId: string; nombre: string; email: string; estadoCuenta: string };
  ficha: typeof paseadores.$inferSelect | null;
};

/** Error tipado: la cuenta no existe o no es rol paseador. */
export class ErrorCuentaInvalida extends Error {
  constructor() {
    super('La cuenta no existe o no es de un paseador');
    this.name = 'ErrorCuentaInvalida';
  }
}

/** Todas las cuentas rol paseador, con su ficha o null (left join). */
export async function listarPaseadores(): Promise<PaseadorListado[]> {
  const filas = await db
    .select({
      userId: user.id,
      nombre: user.name,
      email: user.email,
      estadoCuenta: user.estado,
      fichaId: paseadores.id,
      telefono: paseadores.telefono,
      especialidades: paseadores.especialidades,
      comisionPct: paseadores.comisionPct,
    })
    .from(user)
    .leftJoin(paseadores, eq(paseadores.userId, user.id))
    .where(eq(user.rol, 'paseador'))
    .orderBy(user.name);

  return filas.map((f) => ({
    userId: f.userId,
    nombre: f.nombre,
    email: f.email,
    estadoCuenta: f.estadoCuenta,
    ficha:
      f.fichaId === null
        ? null
        : {
            id: f.fichaId,
            telefono: f.telefono!,
            especialidades: f.especialidades!,
            comisionPct: f.comisionPct!,
          },
  }));
}

/**
 * La cuenta (debe ser rol paseador) + su ficha si existe.
 * `null` si la cuenta no existe o no es paseador.
 */
export async function obtenerFichaPorUsuario(userId: string): Promise<FichaPaseador | null> {
  const [cuenta] = await db
    .select({ id: user.id, nombre: user.name, email: user.email, estado: user.estado })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.rol, 'paseador')));
  if (!cuenta) return null;

  const [ficha] = await db.select().from(paseadores).where(eq(paseadores.userId, userId));

  return {
    cuenta: {
      userId: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      estadoCuenta: cuenta.estado,
    },
    ficha: ficha ?? null,
  };
}

/**
 * Crea la ficha (1:1 — el unique de user_id protege contra duplicados).
 * Lanza ErrorCuentaInvalida si la cuenta no existe o no es paseador.
 */
export async function crearFichaPaseador(
  datos: FichaPaseadorInput,
  actor: ActorSesion,
): Promise<{ id: string }> {
  const [cuenta] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, datos.userId), eq(user.rol, 'paseador')));
  if (!cuenta) throw new ErrorCuentaInvalida();

  const [fila] = await db
    .insert(paseadores)
    .values({
      userId: datos.userId,
      telefono: datos.telefono,
      especialidades: datos.especialidades,
      comisionPct: datos.comisionPct,
      notas: datos.notas || null,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning({ id: paseadores.id });

  return { id: fila!.id };
}

/**
 * Actualiza la ficha con lock optimista. Retorna el id o `null` si la `version`
 * ya no coincide (otro admin la cambió) o la ficha no existe.
 */
export async function actualizarFichaPaseador(
  datos: ActualizarFichaPaseadorInput,
  actor: ActorSesion,
): Promise<{ id: string } | null> {
  const filas = await db
    .update(paseadores)
    .set({
      telefono: datos.telefono,
      especialidades: datos.especialidades,
      comisionPct: datos.comisionPct,
      notas: datos.notas || null,
      updatedBy: actor.id,
      updatedAt: new Date(),
      version: sql`${paseadores.version} + 1`,
    })
    .where(and(eq(paseadores.id, datos.id), eq(paseadores.version, datos.version)))
    .returning({ id: paseadores.id });

  return filas[0] ?? null;
}
