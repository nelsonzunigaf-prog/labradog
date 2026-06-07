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
  boolean,
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

// ── Better Auth: cuentas, sesiones y credenciales ──────────────
// ⚠️ EXCEPCIÓN consciente al naming español (igual que `event_log`): estas 4
// tablas las gestiona Better Auth y deben conservar sus nombres por defecto
// (`user`, `session`, `account`, `verification`) para que el drizzleAdapter
// resuelva los campos sin fricción. Las CLAVES JS deben coincidir con los
// nombres de campo de Better Auth (camelCase); el nombre SQL de columna es libre.
// Las mutaciones sobre cuentas se auditan vía event_log en Story 1.3, no aquí.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // Campos propios de Labradog (additionalFields en lib/auth.ts):
  // rol de sesión — admin | paseador. NO incluye 'sistema' (ese vive solo en
  // event_log.actor_rol, ver src/lib/actor.ts).
  rol: text('rol').notNull(),
  // Soft-delete vía estado — Story 1.3 lo administra; el login rechaza no-activos.
  estado: text('estado').notNull().default('activo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  // Hash de contraseña para el proveedor email+password (nullable: OAuth no lo usa).
  password: text('password'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
