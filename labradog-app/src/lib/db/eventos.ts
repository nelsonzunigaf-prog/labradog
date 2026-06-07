/**
 * Writer tipado de event_log — ÚNICA vía permitida para escribir eventos.
 *
 * Para registrar un nuevo tipo de evento sensible:
 * 1. Agregar la entrada al CatalogoEventos (tipo → contrato del payload).
 * 2. Llamar registrarEvento(...) desde la action correspondiente.
 * El compilador rechaza tipos no catalogados y payloads que no cumplen el contrato.
 */
import { db } from './index';
import { eventLog } from './schema';

// ── Catálogo de eventos sensibles ──────────────────────────────
// Extender aquí al implementar cada story (1.3: cuentas, 2.4: evaluaciones,
// 3.4: cancelaciones, 5.x: pagos/liquidaciones/overrides...).
export type CatalogoEventos = {
  /** Evento técnico de arranque/verificación del sistema */
  sistema_inicializado: { version: string };
};

export type TipoEvento = keyof CatalogoEventos;

/** Quién ejecuta la operación. 'sistema' = procesos automáticos (cron, seeds). */
export type Actor = {
  id: string;
  rol: 'admin' | 'paseador' | 'sistema';
};

/** Entidad afectada por el evento (tabla + id de la fila) */
export type EntidadEvento = {
  tabla: string;
  id: string;
};

export async function registrarEvento<T extends TipoEvento>(
  tipo: T,
  entidad: EntidadEvento,
  payload: CatalogoEventos[T],
  actor: Actor,
) {
  const [fila] = await db
    .insert(eventLog)
    .values({
      tipo,
      entidad: entidad.tabla,
      entidadId: entidad.id,
      payload,
      actorId: actor.id,
    })
    .returning();

  return fila;
}
