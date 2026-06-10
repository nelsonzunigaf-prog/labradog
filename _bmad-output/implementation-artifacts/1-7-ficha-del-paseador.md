---
baseline_commit: 080bcd0
---

# Story 1.7: Ficha del paseador

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a admin,
I want registrar paseadores con sus especialidades y % de comisión,
so that la asignación de paseos y la liquidación usan datos oficiales.

## Acceptance Criteria

1. **Given** una cuenta de paseador creada (Story 1.3), **When** completo su ficha (contacto, especialidades de caminata: energética/senior/olfatoria, % de comisión, notas), **Then** queda guardada con auditoría (`...columnasAuditoria`) y lock optimista (`...columnaVersion`, patrón 1.5/1.6) (FR-039).
2. **And** la ficha es **1:1 con la cuenta** `user` de rol paseador (unique por `user_id`); el listado muestra TODAS las cuentas de rol paseador, con o sin ficha (las sin ficha invitan a crearla).
3. **And** el **% de comisión solo acepta enteros entre 60 y 80** — validado en Zod (mensaje claro) Y como CHECK constraint en BD (FR-036/039).
4. **And** la ficha muestra el **estado de certificación "Sin certificar"** (derivado — NO columna: la fuente de verdad llega con Epic 2), con nota de que la certificación habilita la asignación de paseos.
5. **And** regresión verde: `npm run lint && npm run test && npm run build` + suite E2E completa; sin dependencias nuevas; migraciones 0000-0005 intactas.

## Tasks / Subtasks

- [x] Task 1: Taxonomía de especialidades en el motor de fichas (AC: 1)
  - [x] En `src/lib/engine/fichas.ts` (junto a las red flags — catálogos del método): `export const ESPECIALIDADES_CAMINATA = ['energetica', 'senior', 'olfatoria'] as const;`, `export type EspecialidadCaminata = (typeof ESPECIALIDADES_CAMINATA)[number];`, `export const ETIQUETAS_ESPECIALIDAD: Record<EspecialidadCaminata, string> = { energetica: 'Caminata energética', senior: 'Caminata senior', olfatoria: 'Caminata olfatoria' };`. La tupla alimenta el pgEnum y el z.enum (patrón establecido).
  - [x] Extender `src/lib/engine/fichas.test.ts`: cada especialidad tiene etiqueta.

- [x] Task 2: Schema — enum + tabla `paseadores` + migración (AC: 1, 2, 3)
  - [x] En `src/lib/db/schema.ts`: `especialidadCaminataEnum = pgEnum('especialidad_caminata', ESPECIALIDADES_CAMINATA)` (importar del motor).
  - [x] Tabla `paseadores` (`pgTable('paseadores', {...}, (t) => [...])`): `id uuid pk defaultRandom`; `userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' })` — **1:1 con la cuenta** (text: el id de user es de Better Auth). **`cascade` justificado y documentado**: la ficha es extensión de la cuenta y no tiene sentido sin ella; en producción las cuentas JAMÁS se borran físicamente (regla #8: se desactivan) — el delete solo ocurre en seeds de test (`global-setup` borra y recrea usuarios; con restrict ese seed se rompería); `telefono: text('telefono').notNull()`; `especialidades: especialidadCaminataEnum('especialidades').array().notNull().default(sql\`'{}'\`)` (mismo patrón que `red_flags`); `comisionPct: integer('comision_pct').notNull()`; `notas: text('notas')`; `...columnaVersion`; `...columnasAuditoria`.
  - [x] CHECK del rango (AC3) en el 2º arg: `check('paseadores_comision_rango', sql\`${t.comisionPct} >= 60 AND ${t.comisionPct} <= 80\`)` — importar `check` de `drizzle-orm/pg-core` (API verificada: `check(name: string, value: SQL)` en drizzle 0.45 instalado).
  - [x] NO agregar columna de estado propio (el acceso se gestiona por `user.estado` de 1.3) NI columna de certificación (deriva "Sin certificar" hasta Epic 2 — no inventar el modelo de certificación).
  - [x] `npm run db:generate` → `drizzle/0006_*.sql`; revisar SQL (enum, tabla, unique user_id, FK cascade, CHECK); `npm run db:migrate` a Neon.

- [x] Task 3: Validaciones Zod `lib/validations/paseadores.ts` (AC: 1, 3)
  - [x] `fichaPaseadorSchema = z.object({ userId: z.string().min(1), telefono: z.string().min(1, 'El teléfono es obligatorio'), especialidades: z.array(z.enum(ESPECIALIDADES_CAMINATA)).default([]), comisionPct: z.number().int('Debe ser un entero').min(60, 'La comisión va de 60 a 80').max(80, 'La comisión va de 60 a 80'), notas: z.string().optional() })`.
  - [x] `actualizarFichaPaseadorSchema = fichaPaseadorSchema.omit({ userId: true }).extend({ id: z.string().uuid(), version: z.number().int().nonnegative() })`.
  - [x] Test `paseadores.test.ts`: comisión 59/81/decimal → rechazadas con el mensaje del rango; 60 y 80 (bordes) → aceptadas; especialidad fuera de taxonomía → rechazada; defaults.

- [x] Task 4: Queries `lib/db/queries/paseadores.ts` (AC: 1, 2)
  - [x] ÚNICO lugar con SQL de paseadores. Sin `event_log` (el % vigente no está en la lista de operaciones sensibles; la historia económica la protege el snapshot por paseo de FR-036 — el override puntual en liquidación de 5.x SÍ será evento). `created_by/updated_by = actor.id`.
    - `listarPaseadores()`: **left join** desde `user` (filtrado `rol = 'paseador'`) hacia `paseadores` por `user_id` — devuelve TODAS las cuentas paseador con su ficha o `null` (id, nombre, email, estadoCuenta, ficha: {id, telefono, especialidades, comisionPct} | null). Ordenado por nombre.
    - `obtenerFichaPorUsuario(userId)`: la ficha + datos de la cuenta (nombre, email, estado). `null` en ficha si no existe (la página decide crear vs editar).
    - `crearFichaPaseador(datos, actor)`: validar dentro que la cuenta exista y sea rol paseador (select previo; si no → throw `Error('cuenta inválida')` que la action traduce); insert; retorna `{ id }`. El unique de `user_id` protege contra doble creación concurrente (capturar el conflicto → la action lo traduce a "Esta cuenta ya tiene ficha").
    - `actualizarFichaPaseador(datos, actor)`: **lock optimista** (patrón exacto de `actualizarPerro`): `where(and(eq(id), eq(version)))`, `version+1`, `.returning()` → `null` en conflicto.
  - [x] Tipos exportados (`PaseadorListado`, `FichaPaseador`).

- [x] Task 5: Actions `actions/paseadores.ts` (AC: 1, 2, 3)
  - [x] `'use server'`, vía `crearAction({ schema, roles: ['admin'], handler })`:
    - `crearFichaPaseador`: schema `fichaPaseadorSchema`; traduce 'cuenta inválida' → `ErrorNegocio('La cuenta no existe o no es de un paseador.')` y unique violation → `ErrorNegocio('Esta cuenta ya tiene ficha.')`; `revalidatePath('/admin/paseadores')` y de la ficha.
    - `actualizarFichaPaseador`: conflicto de version → `ErrorNegocio('Este registro cambió, recarga.')` (literal idéntico al de 1.5/1.6); revalida.
  - [x] Test `actions/paseadores.test.ts` (mocks patrón 1.6): crear OK; comisión 85 → rechazada por schema con mensaje del rango (sin llamar la query); conflicto de version → mensaje exacto; rol paseador → 'No autorizado'.

- [x] Task 6: UI (AC: 1, 2, 4)
  - [x] `src/app/admin/paseadores/page.tsx` (Server Component): `listarPaseadores()` → `Table` (nombre, email, estado de cuenta con `Badge`, especialidades como etiquetas, % comisión o "—", certificación: `Badge` secundario **"Sin certificar"** para todos — derivado, con tooltip/nota "la certificación llega con el módulo de capacitación"). Cada fila → link a `/admin/paseadores/[userId]`. Fila sin ficha muestra "Crear ficha →".
  - [x] `src/app/admin/paseadores/[userId]/page.tsx` (Server Component): `obtenerFichaPorUsuario(userId)` (notFound si la cuenta no existe o no es paseador). Header: nombre + badge estado de cuenta + badge "Sin certificar" (AC4) con la nota. Cuerpo: `form-ficha-paseador.tsx` en modo crear (sin ficha) o editar (con ficha, `key={version}` para el remount post-guardado).
  - [x] `src/components/paseadores/form-ficha-paseador.tsx` (cliente, patrón form-perro: `noValidate` + `safeParse` + mensajes `{ok|error}`): teléfono (Input), especialidades (checkboxes desde `ESPECIALIDADES_CAMINATA` + `ETIQUETAS_ESPECIALIDAD`), % comisión (Input number 60-80), notas (textarea). En edición envía `id` + `version`.
  - [x] Enlace "Fichas de paseadores →" en `src/app/admin/page.tsx` (junto a equipo y tutores).

- [x] Task 7: Tests y validación final (AC: todos)
  - [x] Unit verdes (Tasks 1, 3, 5).
  - [x] E2E `e2e/paseadores.spec.ts` (desktop 1280x900, serial, un login): admin → `/admin/paseadores` → ve la cuenta `paseador.test@labradog.cl` sembrada SIN ficha → entra → crea la ficha (teléfono, 2 especialidades, comisión 70) → guardada y visible con badge "Sin certificar" → intenta comisión **85** → mensaje del rango (en español, validación Zod) → edita comisión a 80 (borde) → OK. **Selectores**: cuidar strict mode (labels con substring: usar ids o `exact: true` — aprendizaje 1.6).
  - [x] **Limpieza E2E**: las fichas cuelgan de las cuentas sembradas con FK **cascade** → el `DELETE FROM "user"` del global-setup ya las arrastra; verificar que el global-setup NO necesita cambios (si el run falla por restos, agregar `DELETE FROM paseadores` defensivo antes del delete de users).
  - [x] Regresión: lint + 86+ unit + build + suite E2E completa verdes.

## Dev Notes

### Contexto y alcance

Última story del Epic 1. Tercera ficha de negocio — la más simple (sin hijos, sin archivos), pero con dos particularidades: es **1:1 con una cuenta de acceso** (no entidad independiente como tutores/perros) y tiene la **primera regla numérica de negocio en BD** (CHECK 60-80). Cierra las fundaciones para Epic 2 (capacitación usará estas fichas) y 5.x (liquidaciones leen `comision_pct` para el snapshot al completar paseo). [Source: epics.md#Story 1.7; prd.md#FR-036/039]

### Decisiones de diseño clave (leer antes de implementar)

- **Ficha = extensión 1:1 de la cuenta `user`.** Las cuentas las crea 1.3; esta story NO crea cuentas ni toca Better Auth — agrega la capa de datos del negocio (especialidades, comisión, notas) sobre la cuenta existente. `user_id` unique + FK. El listado parte de `user` (rol paseador) con left join para mostrar también las cuentas sin ficha. [Source: epics.md#Story 1.7 — "Given una cuenta de paseador creada (Story 1.3)"]
- **FK `onDelete: cascade` — excepción justificada al patrón restrict.** Tutores/perros usan restrict porque son entidades raíz de negocio. La ficha del paseador no existe sin su cuenta; en producción las cuentas nunca se borran físicamente (regla #8: `user.estado`), así que el cascade solo actúa en seeds de test (`global-setup` borra y recrea los usuarios sembrados cada corrida — con restrict, ese seed rompería). Documentar en el schema.
- **Comisión: entero 60-80, doble validación.** Zod (mensaje en español para la UI) + CHECK en BD (`check()` de drizzle-orm/pg-core, API verificada en 0.45 instalado: `check(name, sql)`). Es el % VIGENTE de la ficha (opción A del addendum); al completarse un paseo se congela en `paseos.comision_pct_snapshot` (5.x) — por eso cambiarlo aquí no reescribe historia y NO requiere event_log (el override puntual en liquidación de 5.x sí será evento). [Source: prd-addendum#Esquema de comisiones; architecture.md#Data Architecture — inmutabilidad]
- **Certificación "Sin certificar" DERIVADA, no columna.** Epic 2 define el modelo real de certificación (etapas, examen, gate). Inventar una columna ahora crearía un segundo dueño de esa verdad. La UI muestra el badge fijo con nota. [Source: epics.md#Story 1.7 — "'sin certificar' hasta Epic 2"; #Story 2.6]
- **Especialidades = catálogo del método** (energética/senior/olfatoria — taxonomía del método y del mercado). Tupla en `lib/engine/fichas.ts` (junto a red flags) → pgEnum + z.enum + etiquetas UI. Informa la asignación (FR-023) **sin bloquearla** — no hay regla de negocio aquí, solo el catálogo. [Source: prd.md#FR-039]
- **Sin estado propio en la ficha**: el acceso/actividad del paseador se gestiona por `user.estado` (1.3). No duplicar.

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/engine/fichas.ts` — hoy: RED_FLAGS_TUTOR + ETIQUETAS + evaluarRedFlags. Agregar las 3 constantes de especialidades. NO tocar lo existente.
- `src/lib/db/schema.ts` — agregar `especialidadCaminataEnum` + tabla `paseadores` al final (después de perro_compatibilidades). `check` se suma al import de drizzle-orm/pg-core.
- `src/app/admin/page.tsx` — tercer enlace de navegación.
- `e2e/global-setup.ts` — probablemente sin cambios (cascade); verificar.

### Patrones existentes a reutilizar (NO reinventar)

- **Lock optimista**: `queries/perros.ts#actualizarPerro` + action + `key={version}`. **Form cliente**: `components/perros/form-perro.tsx` (noValidate+safeParse, checkboxes, selects). **Listado**: `app/admin/tutores/page.tsx` (Table+Badge). **Tests**: `actions/perros.test.ts` (mocks), `e2e/perros.spec.ts` (selectores con ids/exact). **Tupla→pgEnum**: fichas.ts→schema (red_flags). **Array de enum con default `'{}'`**: `tutores.red_flags`.

### Qué NO hacer (límites de alcance)

- NO crear/editar cuentas (1.3) ni tocar `lib/auth.ts`.
- NO modelar certificación/etapas/exámenes (Epic 2) — solo el badge derivado.
- NO implementar la lógica de asignación ni el gate (3.x) — la especialidad solo se registra.
- NO escribir `event_log` ni agregar dependencias.
- NO vista del propio paseador (`/paseador/*`) — la ficha es del área admin; FR-038 (sus comisiones) es 5.x.

### Dependencias externas / acción de Nelson

- Ninguna. Migración `0006` a Neon.

### Testing standards

- Vitest unit co-ubicado; E2E desktop serial un login con limpieza verificada. CI: lint+test+build.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7] — ACs fuente
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md#F0.4 FR-039, #FR-036, #FR-023, #FR-038] — ficha, comisión, asignación, transparencia
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/addendum.md#Esquema de comisiones] — opción A (60-80 por paseador), snapshot al completar
- [Source: labradog-app/src/lib/db/queries/perros.ts; src/components/perros/form-perro.tsx; e2e/perros.spec.ts] — patrones exactos de 1.6
- [Source: node_modules/drizzle-orm/pg-core/checks.d.ts] — API `check(name, sql)` verificada
- [Source: _bmad-output/implementation-artifacts/1-6-ficha-del-perro-con-compatibilidades-e-historial.md#Dev Agent Record] — aprendizajes (strict mode E2E, par de selectores)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- Sin incidencias: los patrones de 1.5/1.6 (lock optimista, tupla→pgEnum, noValidate+safeParse, selectores E2E con ids) aplicaron directo. El E2E pasó a la primera corrida.

### Completion Notes List

- **Ficha 1:1 con la cuenta** (`user_id` unique + FK **cascade** — excepción justificada y documentada: la ficha no existe sin cuenta, en prod las cuentas solo se desactivan; el cascade permite que el seed de global-setup recree usuarios sin romper). El listado parte de las cuentas rol paseador (left join) y muestra las sin ficha con "Crear ficha →".
- **Comisión 60-80 con doble validación (AC3)**: Zod (mensajes en español, bordes 60/80 testeados) + CHECK `paseadores_comision_rango` en BD. Verificado por E2E: 85 rechazada con el mensaje del método, 70 creada, edición a 80 (borde) OK.
- **Certificación "Sin certificar" derivada (AC4)** — badge fijo en listado y ficha con nota; sin columna (Epic 2 define el modelo).
- **Especialidades** como catálogo en `lib/engine/fichas.ts` (`ESPECIALIDADES_CAMINATA` → pgEnum + z.enum + etiquetas UI), checkboxes en el form.
- **Lock optimista** (patrón 1.5/1.6) + `key={version}`; conflicto → "Este registro cambió, recarga." (test unitario). Unique violation de doble creación → "Esta cuenta ya tiene ficha."
- **Migración `0006` aplicada a Neon**. Sin event_log (el % vigente no es operación sensible; el snapshot por paseo protege la historia — el override de liquidación en 5.x sí será evento).
- **Validación**: lint ✅ · 101/101 unit (+15) ✅ · build ✅ (`/admin/paseadores`, `/admin/paseadores/[userId]`) · E2E 13/13 ✅.

#### Acción requerida de Nelson
- Ninguna. Con esto el **Epic 1 queda completo** (7/7 stories): correr la retrospectiva cuando quieras.

### File List

- labradog-app/src/lib/engine/fichas.ts (modificado — ESPECIALIDADES_CAMINATA + etiquetas) · fichas.test.ts (modificado)
- labradog-app/src/lib/db/schema.ts (modificado — especialidadCaminataEnum + tabla paseadores con CHECK)
- labradog-app/drizzle/0006_fancy_steve_rogers.sql (nuevo — migración)
- labradog-app/drizzle/meta/0006_snapshot.json · _journal.json (generados)
- labradog-app/src/lib/validations/paseadores.ts (nuevo) · paseadores.test.ts (nuevo)
- labradog-app/src/lib/db/queries/paseadores.ts (nuevo — left join cuentas, lock optimista)
- labradog-app/src/actions/paseadores.ts (nuevo) · paseadores.test.ts (nuevo)
- labradog-app/src/components/paseadores/form-ficha-paseador.tsx (nuevo)
- labradog-app/src/app/admin/paseadores/page.tsx (nuevo — listado)
- labradog-app/src/app/admin/paseadores/[userId]/page.tsx (nuevo — ficha crear/editar)
- labradog-app/src/app/admin/page.tsx (modificado — enlace)
- labradog-app/e2e/paseadores.spec.ts (nuevo)

## Change Log

- 2026-06-09: Story 1.7 (ficha del paseador) creada con context engine BMAD. Status → ready-for-dev.
- 2026-06-09: Implementación de Story 1.7: tabla `paseadores` 1:1 con cuenta (migración 0006, CHECK comisión 60-80, FK cascade documentada), catálogo de especialidades en el motor, queries left-join + lock optimista, actions con traducción de errores, UI listado + ficha con badge "Sin certificar" derivado. 15 tests nuevos + E2E. lint+test+build+E2E verdes. Status → review.
