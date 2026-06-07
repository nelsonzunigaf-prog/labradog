/**
 * Proveedor de sesión — interfaz que el wrapper de actions consume.
 *
 * Story 1.2: getActor() lee la sesión real de Better Auth. La firma NO cambió
 * respecto del stub de 1.1, por eso el wrapper (action-wrapper.ts) y sus tests
 * siguen intactos.
 */
import { headers } from 'next/headers';
import { auth } from './auth';

export type Rol = 'admin' | 'paseador';

export type ActorSesion = {
  id: string;
  rol: Rol;
};

/**
 * Actor para auditoría (event_log): una sesión real o un proceso automático.
 * 'sistema' = cron, seeds, materialización — decisión registrada en
 * architecture.md (addendum 07-06-2026). Fuente ÚNICA del tipo de actor.
 */
export type ActorEvento = {
  id: string;
  rol: Rol | 'sistema';
};

export async function getActor(): Promise<ActorSesion | null> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) {
    return null;
  }

  // Soft-delete vía estado: una cuenta no-activa NO autentica (base de Story 1.3).
  if (sesion.user.estado !== 'activo') {
    return null;
  }

  return { id: sesion.user.id, rol: sesion.user.rol as Rol };
}
