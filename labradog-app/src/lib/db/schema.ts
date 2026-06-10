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
import { sql } from 'drizzle-orm';
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { ESTADOS_PASEO } from '../engine/paseo-estados';
import { RED_FLAGS_TUTOR } from '../engine/fichas';

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

// ── paseos: ciclo de vida del paseo (fundación transversal, Story 1.4) ─────
// Primera tabla de NEGOCIO del proyecto → fija la convención de PK uuid
// (gen_random_uuid()) para entidades que aparecen en URLs (paseo/[id]).
// Tabla mínima a propósito: las FKs a recurrencias (3.1), perros (1.6),
// tutores (1.5), paseadores (1.7) y campos como programado_para se agregan por
// ALTER TABLE cuando existan esas tablas. No inventar columnas especulativas.

/** Enum de estados del paseo — la tupla ESTADOS_PASEO (motor puro) es la fuente única. */
export const estadoPaseoEnum = pgEnum('estado_paseo', ESTADOS_PASEO);

export const paseos = pgTable(
  'paseos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable: los paseos puntuales (Story 3.3) no tienen recurrencia. La FK a
    // `recurrencias` se agrega en Story 3.1 cuando exista esa tabla.
    recurrenciaId: uuid('recurrencia_id'),
    // Fecha local Santiago 'YYYY-MM-DD' (la calcula lib/fechas.aFechaLocal).
    fechaLocal: date('fecha_local').notNull(),
    estado: estadoPaseoEnum('estado').notNull().default('pendiente'),
    // Snapshot económico — nullable hasta poblarse (precio en 3.2, comisión al
    // completar en 5.x). Entero CLP (regla #5); porcentaje entero 0-100.
    precioClpSnapshot: integer('precio_clp_snapshot'),
    comisionPctSnapshot: integer('comision_pct_snapshot'),
    ...columnaVersion,
    ...columnasAuditoria,
  },
  (tabla) => [
    // Clave única que habilita la materialización idempotente de Story 3.2.
    // recurrencia_id NULL (puntuales) coexisten: Postgres trata NULLs como
    // distintos (NO usar NULLS NOT DISTINCT).
    unique('paseos_recurrencia_fecha_uq').on(tabla.recurrenciaId, tabla.fechaLocal),
  ],
);

// ── tutores: ficha del tutor con entrevista inicial (Story 1.5) ────────────
// Primera ficha de NEGOCIO: primer uso real de columnasAuditoria (created_by/
// updated_by = actor.id) y columnaVersion (lock optimista multi-admin). El tutor
// NO es usuario en v1: es una ficha gestionada por admins.

/** Plan comercial — catálogo del método (BASE/PLUS/ELITE). */
export const planEnum = pgEnum('plan', ['base', 'plus', 'elite']);
/** Periodicidad de cobro (FR-033): por paseo / semanal / mensual. */
export const cobroPeriodicidadEnum = pgEnum('cobro_periodicidad', [
  'por_paseo',
  'semanal',
  'mensual',
]);
/** Momento de cobro (FR-033): prepago / postpago. */
export const cobroTiempoEnum = pgEnum('cobro_tiempo', ['prepago', 'postpago']);
/** Estado de la ficha del tutor (FR-004) — soft-delete vía estado. */
export const estadoTutorEnum = pgEnum('estado_tutor', ['activo', 'pausado', 'cerrado']);
/** Red flags del tutor — la tupla RED_FLAGS_TUTOR (motor puro) es la fuente única. */
export const redFlagTutorEnum = pgEnum('red_flag_tutor', RED_FLAGS_TUTOR);
/** Tipos de anexo legal (FR-006). */
export const tipoAnexoEnum = pgEnum('tipo_anexo', ['limites_servicio', 'compromiso_etico']);
/** Medio de aceptación del anexo. */
export const medioAnexoEnum = pgEnum('medio_anexo', ['papel', 'pdf']);

export const tutores = pgTable('tutores', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Contacto
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  email: text('email'), // nullable: el tutor no es usuario en v1
  direccionRetiro: text('direccion_retiro').notNull(),
  // Acuerdo comercial (FR-004)
  planDefault: planEnum('plan_default').notNull(),
  cobroPeriodicidad: cobroPeriodicidadEnum('cobro_periodicidad').notNull(),
  cobroTiempo: cobroTiempoEnum('cobro_tiempo').notNull(),
  estado: estadoTutorEnum('estado').notNull().default('activo'),
  // Entrevista inicial (FR-005) — nullable hasta registrarse
  entrevistaHistorial: text('entrevista_historial'),
  entrevistaReactividad: text('entrevista_reactividad'),
  entrevistaEscapes: text('entrevista_escapes'),
  entrevistaEquipamiento: text('entrevista_equipamiento'),
  entrevistaExpectativas: text('entrevista_expectativas'),
  redFlags: redFlagTutorEnum('red_flags')
    .array()
    .notNull()
    .default(sql`'{}'`),
  entrevistaRegistradaAt: timestamp('entrevista_registrada_at', { withTimezone: true }),
  ...columnaVersion,
  ...columnasAuditoria,
});

// ── anexos_tutor: aceptación de anexos legales (FR-006) ────────────────────
// Dos tipos legales; re-registrar el mismo tipo es un upsert por (tutor_id, tipo).

export const anexosTutor = pgTable(
  'anexos_tutor',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tutorId: uuid('tutor_id')
      .notNull()
      .references(() => tutores.id, { onDelete: 'restrict' }),
    tipo: tipoAnexoEnum('tipo').notNull(),
    fechaAceptacion: date('fecha_aceptacion').notNull(),
    medio: medioAnexoEnum('medio').notNull(),
    pdfKey: text('pdf_key'), // key de R2 del PDF opcional
    ...columnasAuditoria,
  },
  (tabla) => [
    unique('anexos_tutor_tutor_tipo_uq').on(tabla.tutorId, tabla.tipo),
  ],
);
