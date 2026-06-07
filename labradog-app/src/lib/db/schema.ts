/**
 * Schema único de la base de datos — TODAS las tablas viven aquí
 * (un solo archivo = visión completa para agentes IA, decisión de arquitectura).
 *
 * Convenciones (ver project-context.md):
 * - Tablas: snake_case plural en español · Columnas: snake_case · FK: `<entidad>_id`
 * - Toda tabla de negocio compone `...columnasAuditoria`
 * - Entidades editables por multi-admin agregan `...columnaVersion` (lock optimista)
 * - Soft-delete vía columna de estado — NUNCA DELETE físico
 * - Dinero: enteros CLP · Fechas: UTC (timestamptz)
 */
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ── Helpers transversales ──────────────────────────────────────

/** Columnas de auditoría — componer en TODA tabla de negocio: `...columnasAuditoria` */
export const columnasAuditoria = {
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

/** Lock optimista — componer en entidades editables por multi-admin: `...columnaVersion` */
export const columnaVersion = {
  version: integer('version').notNull().default(1),
};

// ── event_log: registro inmutable de operaciones sensibles ─────
// Solo INSERT (vía registrarEvento de ./eventos.ts) — jamás UPDATE/DELETE.
// La inmutabilidad se impone también en BD: trigger que rechaza UPDATE/DELETE
// (ver migración 0001).

export const eventLog = pgTable(
  'event_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tipo: text('tipo').notNull(),
    entidad: text('entidad').notNull(),
    entidadId: text('entidad_id').notNull(),
    payload: jsonb('payload').notNull(),
    actorId: text('actor_id').notNull(),
    actorRol: text('actor_rol').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [
    index('event_log_entidad_idx').on(tabla.entidad, tabla.entidadId),
    index('event_log_created_at_idx').on(tabla.createdAt),
  ],
);
