/**
 * Queries de cuentas del equipo (Story 1.3) — ÚNICO lugar que ejecuta SQL
 * para usuarios (regla #2 de capas). Las mutaciones escriben negocio + auditoría
 * en la MISMA `db.transaction` (regla #7, auditoría atómica).
 *
 * La creación replica el patrón del seed (crear-admin.mjs): inserta `user` +
 * `account` (proveedor 'credential', con una contraseña aleatoria hasheada por
 * `hashPassword` de Better Auth). El invitado la sobreescribe vía el enlace de
 * invitación (requestPasswordReset → /reset-password).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import type { ActorEvento } from '../../actor';
import { registrarEvento } from '../eventos';
import { db } from '../index';
import { account, session, user } from '../schema';

export type RolCuenta = 'admin' | 'paseador';

export type MiembroEquipo = {
  id: string;
  name: string;
  email: string;
  rol: string;
  estado: string;
  createdAt: Date;
};

/** Listado del equipo — sin exponer hashes ni datos de `account`. */
export async function listarEquipo(): Promise<MiembroEquipo[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(user.createdAt);
}

export async function buscarPorEmail(email: string) {
  const [fila] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  return fila ?? null;
}

/**
 * Crea una cuenta del equipo de forma atómica (user + account + event_log).
 * Devuelve el id del usuario creado. NO envía el email de invitación: eso lo
 * hace la action (side-effect fuera de la transacción).
 */
export async function crearCuentaEnEquipo(
  datos: { email: string; nombre: string; rol: RolCuenta },
  actor: ActorEvento,
): Promise<{ id: string }> {
  const userId = randomUUID();
  const accountId = randomUUID();
  // Contraseña placeholder larga y aleatoria; el invitado la reemplaza.
  const hash = await hashPassword(randomBytes(32).toString('base64'));

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id: userId,
      name: datos.nombre,
      email: datos.email,
      emailVerified: false,
      rol: datos.rol,
      estado: 'activo',
    });
    await tx.insert(account).values({
      id: accountId,
      userId,
      accountId: userId,
      providerId: 'credential',
      password: hash,
    });
    await registrarEvento(
      'cuenta_creada',
      { tabla: 'user', id: userId },
      { email: datos.email, rol: datos.rol },
      actor,
      tx,
    );
  });

  return { id: userId };
}

/**
 * Activa o desactiva una cuenta de forma atómica (update + event_log).
 * Al desactivar, borra las sesiones vigentes del usuario (cookie inválida al
 * instante). Las `session` son efímeras, no son dato de negocio (sí soft-delete
 * en `user.estado`).
 */
export async function cambiarEstadoCuenta(
  userId: string,
  nuevoEstado: 'activo' | 'inactivo',
  actor: ActorEvento,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [fila] = await tx
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId));

    if (!fila) {
      throw new Error('La cuenta no existe');
    }

    await tx.update(user).set({ estado: nuevoEstado }).where(eq(user.id, userId));

    if (nuevoEstado === 'inactivo') {
      await tx.delete(session).where(eq(session.userId, userId));
    }

    await registrarEvento(
      nuevoEstado === 'inactivo' ? 'cuenta_desactivada' : 'cuenta_reactivada',
      { tabla: 'user', id: userId },
      { email: fila.email },
      actor,
      tx,
    );
  });
}
