/**
 * Proveedor de sesión — interfaz que el wrapper de actions consume.
 *
 * ⚠️ STUB (Story 1.1): retorna null (nadie autenticado).
 * Story 1.2 reemplaza el cuerpo de getActor() por la sesión real de
 * Better Auth SIN cambiar la firma — el wrapper no se toca.
 */

export type Rol = 'admin' | 'paseador';

export type ActorSesion = {
  id: string;
  rol: Rol;
};

export async function getActor(): Promise<ActorSesion | null> {
  // Story 1.2: leer sesión de Better Auth (auth.api.getSession) y mapear rol
  return null;
}
