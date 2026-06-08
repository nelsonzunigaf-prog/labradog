/**
 * Writer tipado de event_log — ÚNICA vía permitida para escribir eventos.
 *
 * Para registrar un nuevo tipo de evento sensible:
 * 1. Agregar la entrada al CatalogoEventos (tipo → contrato del payload).
 * 2. Llamar registrarEvento(...) desde la action correspondiente.
 * El compilador rechaza tipos no catalogados y payloads que no cumplen el contrato.
 */
import type { ActorEvento } from '../actor';
import { db } from './index';
import { eventLog } from './schema';

// ── Catálogo de eventos sensibles ──────────────────────────────
// Extender aquí al implementar cada story (2.4: evaluaciones,
// 3.4: cancelaciones, 5.x: pagos/liquidaciones/overrides...).
export type CatalogoEventos = {
  /** Evento técnico de arranque/verificación del sistema */
  sistema_inicializado: { version: string };
  /** Story 1.3 — gestión de cuentas del equipo */
  cuenta_creada: { email: string; rol: 'admin' | 'paseador' };
  cuenta_desactivada: { email: string };
  cuenta_reactivada: { email: string };
};

export type TipoEvento = keyof CatalogoEventos;

/** Entidad afectada por el evento (tabla + id de la fila) */
export type EntidadEvento = {
  tabla: string;
  id: string;
};

/**
 * Ejecutor de la escritura: el `db` global o un `tx` de `db.transaction(...)`.
 * Permite escribir la auditoría DENTRO de la misma transacción que el negocio
 * (regla #7: negocio + auditoría atómicos), sin dejar de ser `registrarEvento`
 * la única vía de escritura de event_log.
 */
type Ejecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function registrarEvento<T extends TipoEvento>(
  tipo: T,
  entidad: EntidadEvento,
  payload: CatalogoEventos[T],
  actor: ActorEvento,
  ejecutor: Ejecutor = db,
) {
  const [fila] = await ejecutor
    .insert(eventLog)
    .values({
      tipo,
      entidad: entidad.tabla,
      entidadId: entidad.id,
      payload,
      actorId: actor.id,
      actorRol: actor.rol,
    })
    .returning();

  if (!fila) {
    throw new Error('registrarEvento: la inserción no retornó fila');
  }

  return fila;
}
