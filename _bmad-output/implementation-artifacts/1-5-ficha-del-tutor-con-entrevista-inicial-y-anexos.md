---
baseline_commit: 25f0b74
---

# Story 1.5: Ficha del tutor con entrevista inicial y anexos

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a admin,
I want registrar tutores con su entrevista inicial, red flags y anexos legales,
so that el filtro profesional del método queda documentado desde el primer contacto.

## Acceptance Criteria

1. **Given** un tutor nuevo, **When** completo su ficha (contacto, dirección de retiro, acuerdo comercial: plan por defecto + modalidad de cobro, estado), **Then** queda guardada y editable, con auditoría (`...columnasAuditoria`) y lock optimista (`...columnaVersion`) (FR-004).
2. **And** al editar una ficha sobre una `version` obsoleta (otro admin la cambió antes), el guardado falla con "Este registro cambió, recarga" en vez de pisar el cambio (primer uso real del lock optimista del proyecto, regla #9).
3. **Given** una ficha de tutor, **When** registro la entrevista inicial (historial del perro, reactividad, escapes previos, equipamiento, expectativas) y marco red flags de la taxonomía del método, **Then** quedan guardadas en la ficha (FR-005).
4. **And** con **2 o más red flags** el sistema muestra la alerta "evaluar rechazo del servicio" (regla pura en `lib/engine/fichas.ts`), visible en vivo en la UI al marcarlas (FR-005).
5. **Given** una ficha de tutor, **When** registro la aceptación de los anexos legales (límites del servicio, compromiso ético) con fecha y medio de aceptación, adjuntando un PDF escaneado opcional (subido vía el helper `lib/storage.ts` de 1.4), **Then** quedan visibles en la ficha (FR-006).
6. **And** regresión verde: `npm run lint && npm run test && npm run build`; las tablas/migraciones existentes (incluida `paseos` de 1.4) no se rompen; sin dependencias nuevas.

## Tasks / Subtasks

- [ ] Task 1: Motor puro `lib/engine/fichas.ts` — taxonomía de red flags + regla 2+ (AC: 4)
  - [ ] Crear `src/lib/engine/fichas.ts`. Exportar la tupla fuente de verdad de la taxonomía (etapa 7 del método): `export const RED_FLAGS_TUTOR = ['minimiza_conductas', 'insiste_soltar_correa', 'presiona_tiempo', 'oculta_informacion', 'desautoriza_criterio', 'rechaza_protocolos'] as const;` y `export type RedFlagTutor = (typeof RED_FLAGS_TUTOR)[number];`. Esta tupla alimenta el `pgEnum` del schema (Task 4) — MISMO patrón que `ESTADOS_PASEO` de 1.4 (evita desincronización enum BD ↔ tipo TS).
  - [ ] Exportar `ETIQUETAS_RED_FLAG: Record<RedFlagTutor, string>` con el texto humano para la UI (p.ej. `minimiza_conductas: 'Minimiza conductas problemáticas'`, `insiste_soltar_correa: 'Insiste en soltar la correa'`, `presiona_tiempo: 'Presiona por tiempo'`, `oculta_informacion: 'Oculta información'`, `desautoriza_criterio: 'Desautoriza el criterio profesional'`, `rechaza_protocolos: 'Rechaza los protocolos'`).
  - [ ] `export function evaluarRedFlags(redFlags: RedFlagTutor[]): { cantidad: number; sugerirRechazo: boolean }` — función PURA: deduplica (`new Set`), `cantidad = únicas`, `sugerirRechazo = cantidad >= 2`. Sin I/O (regla #2).
  - [ ] Test co-ubicado `src/lib/engine/fichas.test.ts`: 0 y 1 red flag → `sugerirRechazo: false`; 2 y 3 → `true`; duplicados cuentan una sola vez (`['presiona_tiempo','presiona_tiempo']` → cantidad 1, false).

- [ ] Task 2: Schema — enums + tablas `tutores` y `anexos_tutor` + migración (AC: 1, 3, 5)
  - [ ] En `src/lib/db/schema.ts`, definir los `pgEnum` (snake_case, regla de naming): `plan` (`['base','plus','elite']`), `cobroPeriodicidad` = `pgEnum('cobro_periodicidad', ['por_paseo','semanal','mensual'])`, `cobroTiempo` = `pgEnum('cobro_tiempo', ['prepago','postpago'])`, `estadoTutorEnum` = `pgEnum('estado_tutor', ['activo','pausado','cerrado'])`, `redFlagTutorEnum` = `pgEnum('red_flag_tutor', RED_FLAGS_TUTOR)` (importar `RED_FLAGS_TUTOR` de `../engine/fichas`), `tipoAnexoEnum` = `pgEnum('tipo_anexo', ['limites_servicio','compromiso_etico'])`, `medioAnexoEnum` = `pgEnum('medio_anexo', ['papel','pdf'])`.
  - [ ] Tabla `tutores` (`pgTable('tutores', {...})`): `id: uuid().primaryKey().defaultRandom()` (convención de negocio de 1.4); contacto: `nombre text notNull`, `telefono text notNull`, `email text` (nullable — el tutor no es usuario en v1, FR puede no tener email), `direccionRetiro: text('direccion_retiro').notNull()`; acuerdo comercial: `planDefault: plan('plan_default').notNull()`, `cobroPeriodicidad('cobro_periodicidad').notNull()`, `cobroTiempo('cobro_tiempo').notNull()`; `estado: estadoTutorEnum('estado').notNull().default('activo')`; entrevista (nullable hasta registrarse en AC3): `entrevistaHistorial: text('entrevista_historial')`, `entrevistaReactividad`, `entrevistaEscapes`, `entrevistaEquipamiento`, `entrevistaExpectativas` (todas `text` nullable), `redFlags: redFlagTutorEnum('red_flags').array().notNull().default(sql\`'{}'\`)` (array de enum, default vacío — **verificar el SQL generado**; si `.default([])` no compila, usar `.default(sql\`'{}'\`)` importando `sql` de `drizzle-orm`), `entrevistaRegistradaAt: timestamp('entrevista_registrada_at', { withTimezone: true })` (nullable); `...columnaVersion`; `...columnasAuditoria`.
  - [ ] Tabla `anexos_tutor` (`pgTable('anexos_tutor', {...}, (t) => [...])`): `id uuid pk defaultRandom`, `tutorId: uuid('tutor_id').notNull().references(() => tutores.id, { onDelete: 'restrict' })` (soft-delete vía estado, nunca borrar tutores con anexos), `tipo: tipoAnexoEnum('tipo').notNull()`, `fechaAceptacion: date('fecha_aceptacion').notNull()`, `medio: medioAnexoEnum('medio').notNull()`, `pdfKey: text('pdf_key')` (nullable — la key de R2 del PDF opcional), `...columnasAuditoria`. Unique `(tutor_id, tipo)`: `unique('anexos_tutor_tutor_tipo_uq').on(t.tutorId, t.tipo)` (un anexo de cada tipo por tutor; re-registrar = upsert).
  - [ ] `npm run db:generate` → crea `drizzle/0004_*.sql`. **Revisar el SQL**: debe crear los 7 enums, ambas tablas, la FK y el unique. Confirmar que el default del array es `'{}'`. Aplicar con `npm run db:migrate` a Neon. Verificar que 0000-0003 quedan intactas.

- [ ] Task 3: Validaciones Zod compartidas `lib/validations/tutores.ts` (AC: 1, 3, 5)
  - [ ] Crear `src/lib/validations/tutores.ts`. `crearTutorSchema = z.object({ nombre: z.string().min(1), telefono: z.string().min(1), email: z.string().email().optional().or(z.literal('')), direccionRetiro: z.string().min(1), planDefault: z.enum(['base','plus','elite']), cobroPeriodicidad: z.enum(['por_paseo','semanal','mensual']), cobroTiempo: z.enum(['prepago','postpago']), estado: z.enum(['activo','pausado','cerrado']).default('activo') })`.
  - [ ] `actualizarTutorSchema = crearTutorSchema.extend({ id: z.string().uuid(), version: z.number().int().nonnegative() })` (la `version` viaja para el lock optimista, AC2).
  - [ ] `entrevistaSchema = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), historial: z.string().optional(), reactividad: z.string().optional(), escapes: z.string().optional(), equipamiento: z.string().optional(), expectativas: z.string().optional(), redFlags: z.array(z.enum(RED_FLAGS_TUTOR)).default([]) })` (reusar `RED_FLAGS_TUTOR` del motor para el enum — es una tupla `as const`, válida en `z.enum`).
  - [ ] `anexoSchema = z.object({ tutorId: z.string().uuid(), tipo: z.enum(['limites_servicio','compromiso_etico']), fechaAceptacion: z.string(), medio: z.enum(['papel','pdf']), pdfKey: z.string().optional() })`.
  - [ ] Test `src/lib/validations/tutores.test.ts`: plan inválido, red flag fuera de taxonomía, `version` no entera, email mal formado, requeridos vacíos.

- [ ] Task 4: Capa de datos `lib/db/queries/tutores.ts` (AC: 1, 2, 3, 5)
  - [ ] Crear `src/lib/db/queries/tutores.ts` — ÚNICO lugar que ejecuta SQL para tutores (regla #2). Importar `db`, las tablas y `eq`/`and` de `drizzle-orm`. **Auditoría: `created_by`/`updated_by` se setean con `actor.id`** (primer uso real de `columnasAuditoria` en un insert del proyecto). **NO escribir en `event_log`**: el alta/edición de fichas NO está en la lista de operaciones sensibles (pagos, evaluaciones, overrides, cancelaciones, cuentas) — no extender `CatalogoEventos` aquí.
    - `listarTutores()`: `select` de columnas de listado (`id, nombre, telefono, planDefault, estado`) ordenado por `nombre`.
    - `obtenerTutor(id)`: la ficha completa + sus anexos (`select` de `tutores` por id + `select` de `anexos_tutor` por `tutor_id`). Retorna `null` si no existe.
    - `crearTutor(datos, actor: ActorSesion)`: `insert(tutores).values({ ...datos, email: datos.email || null, createdBy: actor.id, updatedBy: actor.id }).returning({ id })`. Retorna `{ id }`.
    - `actualizarTutor(datos, actor)`: **lock optimista (AC2)** — `update(tutores).set({ ...campos, updatedBy: actor.id, version: sql\`${tutores.version} + 1\` }).where(and(eq(tutores.id, datos.id), eq(tutores.version, datos.version))).returning({ id })`. Si el array vuelve **vacío** → retornar `null` (la action lo traduce a ErrorNegocio "Este registro cambió, recarga"). NO lanzar desde la query.
    - `registrarEntrevista(datos, actor)`: mismo patrón de lock optimista que `actualizarTutor`, seteando `entrevistaHistorial/Reactividad/Escapes/Equipamiento/Expectativas`, `redFlags`, `entrevistaRegistradaAt: new Date()`, `updatedBy`, `version + 1`, `where id AND version`. Retorna `null` si no hubo match.
    - `registrarAnexo(datos, actor)`: `insert(anexosTutor).values({ ...datos, createdBy: actor.id, updatedBy: actor.id }).onConflictDoUpdate({ target: [anexosTutor.tutorId, anexosTutor.tipo], set: { fechaAceptacion, medio, pdfKey, updatedBy: actor.id } })` (upsert: re-registrar el mismo tipo actualiza). Convertir `fechaAceptacion` (string 'YYYY-MM-DD') al tipo `date` (Drizzle `date` en modo string lo acepta directo).
  - [ ] Tipos exportados para la UI (`TutorListado`, `TutorFicha`, `AnexoTutor`).

- [ ] Task 5: Server Actions `actions/tutores.ts` (AC: 1, 2, 3, 5)
  - [ ] Crear `src/actions/tutores.ts` con `'use server'`. Todas vía `crearAction({ schema, roles: ['admin'], handler })`.
    - `crearTutor`: schema `crearTutorSchema`. handler llama `queries.crearTutor`, `revalidatePath('/admin/tutores')`, retorna `{ id }`.
    - `actualizarTutor`: schema `actualizarTutorSchema`. handler: `const r = await queries.actualizarTutor(input, actor); if (!r) throw new ErrorNegocio('Este registro cambió, recarga.'); revalidatePath(...)`. (AC2)
    - `registrarEntrevista`: schema `entrevistaSchema`. handler igual con ErrorNegocio en conflicto de version. `revalidatePath('/admin/tutores/' + input.id)`.
    - `registrarAnexo`: schema `anexoSchema`. handler llama `queries.registrarAnexo`, revalida la ficha.
  - [ ] **Subida del PDF (AC5, opcional)** — `crearAction` valida un objeto Zod, no encaja con `File`/binario. Crear una server action aparte `subirAnexoPdf(formData: FormData)` en el mismo archivo (con `'use server'`): verifica rol con `getActor()` manualmente (deviación documentada de la regla #4, justificada por el binario), extrae el `File`, valida que sea `application/pdf` y ≤ 5MB (si no → `{ ok: false }`), lee los bytes (`new Uint8Array(await file.arrayBuffer())`), llama `storage.subirArchivo({ key: \`anexos/${tutorId}/${tipo}.pdf\`, contenido, contentType: 'application/pdf' })` (storage.ts sigue siendo la ÚNICA frontera con R2) y retorna `{ ok: true, key }`. La UI usa la key devuelta como `pdfKey` al llamar `registrarAnexo`. NO comprimir (es PDF, no imagen).
  - [ ] Test `src/actions/tutores.test.ts` (mockear `getActor` y las queries, patrón de `cuentas.test.ts`): `actualizarTutor` cuando la query devuelve `null` → `{ ok: false, error: 'Este registro cambió, recarga.' }` (AC2); `crearTutor` happy path → `{ ok: true, data: { id } }`.

- [ ] Task 6: UI admin de tutores (AC: 1, 2, 3, 4, 5)
  - [ ] `src/app/admin/tutores/page.tsx` (Server Component, desktop-first): `listarTutores()` → `Table` (nombre, teléfono, plan, estado con `Badge`), cada fila enlaza a `/admin/tutores/[id]`. Incluir el formulario/enlace de "Nueva ficha". Reutilizar los componentes shadcn ya presentes (`table`, `badge`, `button`, `input`, `label`, `select`); agregar `textarea` y/o `checkbox` con `npx shadcn@latest add <c> -y` si hacen falta (shadcn copia componentes, no es dependencia).
  - [ ] `src/components/tutores/form-tutor.tsx` (cliente, patrón `form-crear-cuenta.tsx`: `useState` + `safeParse` + llamar la action + mostrar `{ok|error}`): crea o edita la ficha (contacto, dirección, plan/modalidad de cobro con `<select>`, estado). En modo edición incluye un campo oculto/estado con la `version` actual y la envía; si la action devuelve "Este registro cambió, recarga", mostrar el mensaje y sugerir recargar (AC2).
  - [ ] `src/app/admin/tutores/[id]/page.tsx` (Server Component): `obtenerTutor(id)` (404/estado vacío si no existe); renderiza la ficha editable (`form-tutor` en modo edición), la sección de entrevista y la de anexos.
  - [ ] `src/components/tutores/seccion-entrevista.tsx` (cliente): textareas (historial, reactividad, escapes, equipamiento, expectativas) + checkboxes de red flags usando `RED_FLAGS_TUTOR` + `ETIQUETAS_RED_FLAG` del motor. **Alerta en vivo (AC4)**: al cambiar la selección, llamar `evaluarRedFlags(seleccionadas)` (función pura, segura en cliente) y si `sugerirRechazo` mostrar el aviso destacado "Evaluar rechazo del servicio (2+ red flags)". Guardar vía `registrarEntrevista` (envía `id` + `version`).
  - [ ] `src/components/tutores/seccion-anexos.tsx` (cliente): lista los anexos existentes (tipo, fecha, medio, enlace al PDF si hay `pdfKey` → `storage.urlPublica` o el `R2_PUBLIC_URL`); formulario para registrar un anexo (tipo, fecha, medio, input file PDF opcional). Si hay PDF: primero `subirAnexoPdf(formData)` → tomar `key` → luego `registrarAnexo({ ..., pdfKey: key })`. Sin PDF: llamar `registrarAnexo` directo.
  - [ ] Enlace a `/admin/tutores` desde `src/app/admin/page.tsx` (junto al de equipo).

- [ ] Task 7: Tests y validación final (AC: todos)
  - [ ] Unit (Vitest): los de Tasks 1, 3, 5 verdes.
  - [ ] E2E `e2e/tutores.spec.ts` (Playwright, `test.use({ viewport: { width: 1280, height: 900 } })` — admin es desktop-first, igual que `equipo.spec.ts`), reusando `e2e/global-setup.ts` (admin sembrado): login admin → `/admin/tutores` → crear ficha (nombre, teléfono, dirección, plan, modalidad, estado) → aparece en el listado → abrir la ficha → registrar entrevista marcando **2 red flags** → **ver la alerta** de rechazo → registrar un anexo (sin PDF, para no depender de R2 en CI/local). Usar datos únicos por corrida.
  - [ ] Regresión: `npm run lint && npm run test && npm run build` verdes; `e2e/auth.spec.ts` y `e2e/equipo.spec.ts` siguen pasando (no romper 1.2/1.3).

## Dev Notes

### Contexto y alcance

Primera **ficha de negocio** del proyecto (FR-004/005/006). Es CRUD con dos piezas con lógica: el **lock optimista** (primer uso real de `columnaVersion`) y la **regla pura de red flags** (`lib/engine/fichas.ts`). El tutor NO es usuario en v1: es una ficha gestionada por admins (no se crea cuenta, no toca Better Auth). [Source: prd.md#F0.2; project-context.md#Contratos diferidos]

### Decisiones de diseño clave (leer antes de implementar)

- **Lock optimista de verdad (AC2).** La `version` viaja desde la UI; la query actualiza con `where id AND version=esperada` y `version+1`; si 0 filas → la action lanza `ErrorNegocio('Este registro cambió, recarga.')`. La query NO lanza (retorna `null`); el mensaje de negocio lo produce la action (mantiene `ErrorNegocio` en la capa correcta). Patrón reutilizable por todas las fichas editables multi-admin. [Source: project-context.md#9; architecture.md#Resoluciones de brechas — concurrencia multi-admin]
- **Auditoría con `columnasAuditoria`, SIN `event_log`.** `created_by`/`updated_by` = `actor.id` (primer insert real que las usa). El alta/edición de fichas NO es operación sensible (la lista sensible es pagos/evaluaciones/overrides/cancelaciones/cuentas) → no se escribe `event_log` ni se extiende `CatalogoEventos`. [Source: architecture.md#Data Architecture; project-context.md#7]
- **Taxonomía de red flags = tupla del motor → pgEnum.** `RED_FLAGS_TUTOR` (6 conductas de etapa 7) vive en `lib/engine/fichas.ts` y alimenta `pgEnum('red_flag_tutor', ...)` y el `z.enum(...)` de validaciones. MISMO patrón que `ESTADOS_PASEO` de 1.4: una sola fuente de verdad. Regla: **2+ red flags → sugerir rechazo** (`evaluarRedFlags`, función pura). La alerta se muestra en vivo en el cliente (la función es pura, sin I/O, segura de importar en componentes). [Source: prd-addendum#Taxonomías; epics.md#Story 1.5; architecture.md concern #4]
- **PK uuid + enums snake_case** siguiendo la convención fijada en 1.4. Los 7 enums nuevos son catálogos del método (concern #4). [Source: architecture.md addendum Story 1.4; project-context.md#Naming]
- **Anexos = tabla aparte con upsert por `(tutor_id, tipo)`.** Dos tipos legales (límites del servicio, compromiso ético); re-registrar el mismo tipo actualiza fecha/medio/PDF. PDF opcional en R2 vía `storage.ts` (helper de 1.4). En v1 basta registrar que se firmaron (sin firma electrónica). [Source: prd.md#FR-006]
- **Subida de PDF: action aparte fuera de `crearAction`.** `crearAction` valida un objeto Zod y no encaja con `File` binario. `subirAnexoPdf(formData)` verifica rol con `getActor()` manualmente (deviación justificada y documentada de la regla #4), valida tipo/tamaño y delega en `storage.subirArchivo` (ÚNICA frontera R2). El PDF es opcional: el E2E y el flujo base funcionan sin R2 (storage degrada no-op en dev). [Source: project-context.md#4,#12; storage.ts de 1.4]

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/schema.ts` — hoy tiene helpers + `event_log` + tablas Better Auth + `paseos` + `estadoPaseoEnum`. Agregar 7 enums nuevos, `tutores` y `anexos_tutor`. NO tocar lo existente. Importar `RED_FLAGS_TUTOR` de `../engine/fichas` (igual que ya importa `ESTADOS_PASEO`).
- `src/app/admin/page.tsx` — agregar enlace a `/admin/tutores` (junto al de equipo).

### Patrones existentes a reutilizar (NO reinventar)

- **`crearAction({ schema, roles, handler })`** + `ErrorNegocio` para mensajes de negocio (`src/lib/action-wrapper.ts`). Contrato `{ ok, data|error }`, nunca throw a la UI. [Source: action-wrapper.ts]
- **Queries con `actor`** y, cuando aplica, lock optimista vía `where ... AND version` + `.returning()` (no hay precedente de version aún; este es el primero — seguir el patrón de transacción de `queries/usuarios.ts` para estilo de imports/db).
- **Form cliente**: `useState` + `schema.safeParse` + llamar la action + mostrar `{ ok | error }` + `router.refresh()` — ver `src/components/equipo/form-crear-cuenta.tsx`.
- **Página admin con tabla**: `Table`/`Badge` de shadcn + Server Component que llama la query — ver `src/app/admin/equipo/page.tsx`.
- **Motor puro + tupla fuente de verdad + pgEnum**: `src/lib/engine/paseo-estados.ts` y su uso en `schema.ts`.
- **Tests**: Vitest node co-ubicado, mocks con `vi.hoisted`/`vi.mock` (ver `cuentas.test.ts`, `eventos.test.ts`); E2E desktop `viewport 1280x900` (ver `e2e/equipo.spec.ts`).
- **Migraciones**: `npm run db:generate` → revisar `.sql` → `npm run db:migrate`.

### Qué NO hacer (límites de alcance)

- NO crear cuenta de usuario para el tutor (no es usuario en v1; nada de Better Auth).
- NO implementar fichas de perro (Story 1.6) ni compatibilidades (`perro_compatibilidades`) — esta story es SOLO el tutor. La entrevista registra "historial del perro" como texto libre a nivel tutor (antes de existir fichas de perro).
- NO escribir en `event_log` ni extender `CatalogoEventos`.
- NO implementar recurrencias/agenda/cobros (el `plan_default` y la modalidad solo se guardan; su uso llega en 3.x/5.x).
- NO firma electrónica de anexos (v1: solo registrar fecha/medio + PDF opcional).
- NO romper `paseos` ni los enums de 1.4.

### Dependencias externas / acción de Nelson

- Ninguna dependencia npm nueva. El PDF de anexos usa R2 (helper de 1.4): en **prod** requiere las vars de R2 ya anotadas; en **dev** sin R2 la subida degrada no-op (el resto del flujo funciona).
- La migración `0004` debe aplicarse a Neon (`npm run db:migrate`).

### Testing standards

- Vitest unit co-ubicado (`*.test.ts`), node env. Mockear `getActor` + queries para tests de actions.
- E2E Playwright en `e2e/` desktop (`viewport 1280x900`), reusando `global-setup.ts`. Datos únicos por corrida. No depender de R2 en E2E (anexo sin PDF).
- CI verde: `npm run lint && npm run test && npm run build`. E2E corre local.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — ACs fuente
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md#F0.2] — FR-004/005/006
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/addendum.md#Taxonomías del método; #Modalidades de cobro] — red flags de tutor (6), 6 modalidades de cobro, planes
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, #Resoluciones de brechas, #Addendum Story 1.4] — auditoría, lock optimista, convención PK uuid, taxonomías como catálogos
- [Source: labradog-app/src/lib/action-wrapper.ts; src/lib/db/queries/usuarios.ts; src/actions/cuentas.ts; src/components/equipo/form-crear-cuenta.tsx; src/app/admin/equipo/page.tsx] — patrones exactos a reutilizar
- [Source: labradog-app/src/lib/engine/paseo-estados.ts; src/lib/storage.ts] — motor puro + tupla→pgEnum; frontera R2 (helper de 1.4)
- [Source: _bmad-output/implementation-artifacts/1-4-fundaciones-transversales-almacenamiento-fechas-y-estados-del-paseo.md] — aprendizajes de la story previa

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-09: Story 1.5 (ficha del tutor con entrevista inicial y anexos) creada con context engine BMAD. Status → ready-for-dev.
