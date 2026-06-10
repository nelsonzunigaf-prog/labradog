---
baseline_commit: bbff193
---

# Story 1.6: Ficha del perro con compatibilidades e historial

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a admin,
I want registrar los perros de cada tutor con el perfil del método y sus compatibilidades,
so that cada paseo se planifica con la información que el método exige.

## Acceptance Criteria

1. **Given** un tutor con ficha, **When** agrego un perro (nombre, foto — helpers de 1.4, raza, grupo de raza operativo, edad, talla, condición física, temperamento, equipamiento, premios aceptados, notas de manejo con marca de "crítica"), **Then** el perfil queda completo y visible (FR-007).
2. **And** el perfil es editable con auditoría (`...columnasAuditoria`) y lock optimista (`...columnaVersion`, mensaje "Este registro cambió, recarga" — mismo patrón de 1.5).
3. **And** la foto se comprime en el cliente (`comprimirImagen` de 1.4: WebP ≤1600px ≤400KB) y se sube a R2 vía `storage.ts`; en dev sin R2 el flujo no se rompe (no-op).
4. **Given** dos perros del mismo tutor, **When** marco compatibilidad entre ellos, **Then** la relación queda registrada **en ambos sentidos** (tabla `perro_compatibilidades`) y habilitará paseos de hasta 3 perros del mismo tutor (FR-008); marcar compatibilidad entre perros de **distinto** tutor es rechazado con mensaje claro.
5. **Given** la ficha de un perro, **When** la abro, **Then** incluye la sección de **historial** (paseos, incidentes, evolución emocional) que muestra **estados vacíos** mientras no haya paseos (los datos llegan en épicas 3/4) (FR-009).
6. **And** regresión verde: `npm run lint && npm run test && npm run build` + suite E2E completa; sin dependencias nuevas; migraciones 0000-0004 intactas.

## Tasks / Subtasks

- [ ] Task 1: Schema — enums + tablas `perros` y `perro_compatibilidades` + migración (AC: 1, 4)
  - [ ] En `src/lib/db/schema.ts`, definir enums (catálogos del método, concern #4): `grupoRazaEnum = pgEnum('grupo_raza', ['trabajo_guardia', 'pastora', 'caza', 'otro'])` (taxonomía oficial del módulo razas), `tallaEnum = pgEnum('talla', ['pequena', 'mediana', 'grande'])`, `estadoPerroEnum = pgEnum('estado_perro', ['activo', 'inactivo'])` (soft-delete vía estado, regla #8).
  - [ ] Tabla `perros` (`pgTable('perros', {...})`): `id uuid pk defaultRandom`; `tutorId: uuid('tutor_id').notNull().references(() => tutores.id, { onDelete: 'restrict' })`; `nombre text notNull`; `fotoKey: text('foto_key')` (nullable — key R2); `raza text notNull`; `grupoRaza: grupoRazaEnum('grupo_raza').notNull()`; `edad: integer('edad')` (años aprox, nullable — no siempre se sabe); `talla: tallaEnum('talla').notNull()`; `condicionFisica: text('condicion_fisica')`, `temperamento: text('temperamento')`, `equipamiento: text('equipamiento')`, `premiosAceptados: text('premios_aceptados')` (texto libre: el método no fija taxonomía para estos); `notasManejo: text('notas_manejo')`; `notasCriticas: boolean('notas_criticas').notNull().default(false)` (marca "crítica" — el paseador las verá sin scroll, UX 4.x); `estado: estadoPerroEnum('estado').notNull().default('activo')`; `...columnaVersion`; `...columnasAuditoria`.
  - [ ] Tabla `perro_compatibilidades` (`pgTable('perro_compatibilidades', {...}, (t) => [...])`): `id uuid pk defaultRandom`; `perroMenorId: uuid('perro_menor_id').notNull().references(() => perros.id, { onDelete: 'restrict' })`; `perroMayorId: uuid('perro_mayor_id').notNull().references(() => perros.id, { onDelete: 'restrict' })`; `...columnasAuditoria`. **Par canónico**: se guarda UNA fila por par con `perro_menor_id < perro_mayor_id` (orden lexicográfico de uuid impuesto en la capa de queries) + `unique('perro_compat_par_uq').on(t.perroMenorId, t.perroMayorId)`. La bidireccionalidad (AC4 "ambos sentidos") se resuelve en la query de lectura (busca el id en ambas columnas), NO duplicando filas.
  - [ ] `npm run db:generate` → `drizzle/0005_*.sql`; revisar el SQL (3 enums, 2 tablas, FKs restrict, unique); `npm run db:migrate` a Neon. Verificar 0000-0004 intactas.

- [ ] Task 2: Validaciones Zod `lib/validations/perros.ts` (AC: 1, 2, 4)
  - [ ] `crearPerroSchema = z.object({ tutorId: z.string().uuid(), nombre: z.string().min(1), raza: z.string().min(1), grupoRaza: z.enum(['trabajo_guardia','pastora','caza','otro']), edad: z.number().int().min(0).max(30).optional(), talla: z.enum(['pequena','mediana','grande']), condicionFisica: z.string().optional(), temperamento: z.string().optional(), equipamiento: z.string().optional(), premiosAceptados: z.string().optional(), notasManejo: z.string().optional(), notasCriticas: z.boolean().default(false), estado: z.enum(['activo','inactivo']).default('activo') })`.
  - [ ] `actualizarPerroSchema = crearPerroSchema.omit({ tutorId: true }).extend({ id: z.string().uuid(), version: z.number().int().nonnegative() })` (el perro no cambia de tutor en v1).
  - [ ] `compatibilidadSchema = z.object({ perroAId: z.string().uuid(), perroBId: z.string().uuid() }).refine((d) => d.perroAId !== d.perroBId, { message: 'Un perro no puede ser compatible consigo mismo' })`.
  - [ ] Test `perros.test.ts`: grupo de raza fuera de taxonomía, edad negativa/100, talla inválida, compatibilidad consigo mismo, defaults (notasCriticas false, estado activo).

- [ ] Task 3: Queries `lib/db/queries/perros.ts` (AC: 1, 2, 4)
  - [ ] ÚNICO lugar con SQL de perros (regla #2). Sin `event_log` (fichas no son operación sensible). `created_by/updated_by = actor.id`.
    - `listarPerrosDeTutor(tutorId)`: perros del tutor ordenados por nombre (columnas de listado: id, nombre, raza, grupoRaza, talla, estado, fotoKey, notasCriticas).
    - `obtenerPerro(id)`: la fila completa + nombre del tutor (join simple o segunda query) + sus compatibilidades resueltas (ver abajo). `null` si no existe.
    - `crearPerro(datos, actor)`: insert con auditoría; retorna `{ id }`.
    - `actualizarPerro(datos, actor)`: **lock optimista** — `set({..., updatedBy, updatedAt: new Date(), version: sql\`version + 1\`}).where(and(eq(id), eq(version)))` → `.returning()`; vacío → `null` (la action lo traduce a ErrorNegocio). MISMO patrón de `queries/tutores.ts`.
    - `marcarCompatibilidad({ perroAId, perroBId }, actor)`: (a) cargar ambos perros y **validar mismo tutor** — si no, `throw new Error('distinto tutor')` que la action traduce (AC4); (b) normalizar el par: `[menor, mayor] = [a, b].sort()` (orden lexicográfico de los uuid); (c) `insert ... .onConflictDoNothing({ target: [perroMenorId, perroMayorId] })` (idempotente: re-marcar no duplica ni falla).
    - `quitarCompatibilidad({ perroAId, perroBId })`: DELETE de la fila del par canónico. (Las compatibilidades son relaciones operativas re-evaluables, NO datos de negocio histórico — el DELETE físico es correcto aquí; documentarlo en el código. Soft-delete aplica a fichas, no a esta relación.)
    - `listarCompatibilidadesDePerro(perroId)`: filas donde `perro_menor_id = id OR perro_mayor_id = id` (bidireccionalidad por lectura, usar `or()` de drizzle), devolviendo el OTRO perro de cada par (id + nombre) — join contra `perros`.
  - [ ] Tipos exportados (`PerroListado`, `PerroFicha`, `CompatibilidadPerro`).

- [ ] Task 4: Actions `actions/perros.ts` (AC: 1, 2, 3, 4)
  - [ ] `'use server'`, todas vía `crearAction({ schema, roles: ['admin'], handler })`:
    - `crearPerro`: valida que el tutor exista (`obtenerTutor` o query propia; si no → ErrorNegocio); llama `qCrearPerro`; `revalidatePath('/admin/tutores/' + input.tutorId)`; retorna `{ id }`.
    - `actualizarPerro`: conflicto de version → `ErrorNegocio('Este registro cambió, recarga.')` (constante compartida — extraerla o repetir literal idéntico al de tutores); revalida `/admin/perros/[id]`.
    - `marcarCompatibilidad`: schema `compatibilidadSchema`; captura el error "distinto tutor" de la query y lanza `ErrorNegocio('Solo se puede marcar compatibilidad entre perros del mismo tutor.')`; revalida la ficha de ambos perros.
    - `quitarCompatibilidad`: schema `compatibilidadSchema` (sin el refine de no-self si molesta — basta el mismo schema); revalida.
  - [ ] `subirFotoPerro(formData)`: action aparte (binario `File`, fuera de `crearAction` — patrón `subirAnexoPdf` de 1.5): `getActor()` manual + rol admin; valida `image/webp|jpeg|png` y ≤ 2MB (ya viene comprimida del cliente a ≤400KB; el margen tolera fallback sin compresión); `key = \`perros/${perroId}/foto.webp\``; `storage.subirArchivo`; **además persiste `fotoKey`** en la fila del perro (query `actualizarFotoPerro(perroId, fotoKey, actor)` — update simple SIN version, no es edición concurrente de campos de negocio); retorna `{ ok, key }`.
  - [ ] Test `actions/perros.test.ts` (mocks de getActor + queries, patrón `tutores.test.ts`): crear OK; conflicto de version → mensaje exacto; compatibilidad entre tutores distintos → `{ok:false}` con el mensaje de negocio; rol paseador → 'No autorizado'.

- [ ] Task 5: UI (AC: 1, 2, 3, 4, 5)
  - [ ] **Sección "Perros" en `/admin/tutores/[id]`** (`src/components/perros/seccion-perros.tsx`, cliente o server+cliente): lista los perros del tutor (mini-card: foto si hay — `urlPublica(fotoKey)` resuelta en server —, nombre con link a `/admin/perros/[id]`, raza, talla, badge estado, ⚠️ si `notasCriticas`) + form de alta de perro (campos de FR-007; selects para grupoRaza/talla/estado; checkbox "notas críticas"). Patrón form: `useState` + `noValidate` + `safeParse` + action + mensaje `{ok|error}` (aprendizaje de 1.5: noValidate para mensajes Zod en español).
  - [ ] **Página `/admin/perros/[id]`** (`src/app/admin/perros/[id]/page.tsx`, Server Component): `obtenerPerro(id)` (notFound si no existe). Header con nombre + link "← {tutor}" a su ficha. Tres bloques:
    1. `form-perro.tsx` (cliente, modo edición con `version`; remontar con `key={perro.version}` — aprendizaje de 1.5) + **foto**: muestra la actual (o placeholder) y un input file que llama `comprimirImagen(file)` (import de `@/lib/comprimir-imagen` — cliente) y luego `subirFotoPerro(formData)`; tras éxito `router.refresh()`. En dev sin R2: la subida no rompe (storage no-op) — la foto no se verá, mostrar el mensaje de éxito igual.
    2. `seccion-compatibilidades.tsx` (cliente): lista las compatibilidades existentes (nombre del otro perro + botón quitar) + select con los demás perros **del mismo tutor** (pasados como prop desde el server: `listarPerrosDeTutor` menos el actual) + botón marcar. Nota visible: "habilita paseos de hasta 3 perros del mismo tutor".
    3. `seccion-historial.tsx` (server o estático): tres sub-bloques (Paseos / Incidentes / Evolución emocional) con **estados vacíos** explícitos ("Aún no hay paseos registrados", etc.) y nota de que se poblarán con la operación (épicas 3/4). NO consultar la tabla `paseos` (no tiene `perro_id` aún).
  - [ ] La página del tutor (`/admin/tutores/[id]/page.tsx`) agrega la sección Perros (server: `listarPerrosDeTutor` + pasar data).
  - [ ] Si hace falta un componente shadcn nuevo (p.ej. `card`), agregarlo con `npx shadcn@latest add <c> -y`.

- [ ] Task 6: Tests y validación final (AC: todos)
  - [ ] Unit verdes (Tasks 2 y 4).
  - [ ] E2E `e2e/perros.spec.ts` (desktop 1280x900, serial, un login — patrón `tutores.spec.ts`): crear tutor (nombre único) → en su ficha agregar **2 perros** (datos mínimos: nombre/raza/grupo/talla; uno con notas críticas marcadas) → ambos aparecen en la sección Perros → abrir perro 1 → marcar compatibilidad con perro 2 → aparece en la lista → abrir perro 2 → **la compatibilidad también se ve desde el otro lado (AC4 bidireccional)** → quitar compatibilidad desde perro 2 → desaparece → verificar estados vacíos del historial. SIN subir foto (no depender de R2; la compresión de canvas tampoco corre fiable en headless).
  - [ ] **Actualizar la limpieza de `e2e/global-setup.ts`**: los perros E2E cuelgan de tutores `Tutor E2E %` — borrar ANTES de los tutores: `DELETE FROM perro_compatibilidades WHERE perro_menor_id IN (SELECT id FROM perros WHERE tutor_id IN (SELECT id FROM tutores WHERE nombre LIKE 'Tutor E2E %' OR nombre LIKE 'Tutor Verif %')) OR perro_mayor_id IN (...)`; luego `DELETE FROM perros WHERE tutor_id IN (...)`; luego anexos y tutores (orden por FKs restrict). (Aprendizaje de 1.5: sin limpieza la BD acumula basura de test.)
  - [ ] Regresión: `npm run lint && npm run test && npm run build` + suite E2E completa verdes (auth/equipo/tutores no se rompen).

## Dev Notes

### Contexto y alcance

Segunda ficha de negocio (FR-007/008/009), hija de `tutores`. Reutiliza TODO lo establecido: PK uuid, enums desde catálogos, lock optimista (patrón 1.5), helpers de foto (1.4). Las dos piezas nuevas con lógica: el **par canónico** de compatibilidades y el **primer uso real del pipeline de fotos** (comprimir en cliente → R2). [Source: epics.md#Story 1.6; prd.md#F0.3]

### Decisiones de diseño clave (leer antes de implementar)

- **Compatibilidad = una fila por par (canónico), bidireccional por lectura.** "Registrada en ambos sentidos" (AC4) NO significa dos filas: se guarda el par ordenado (`perro_menor_id < perro_mayor_id`, orden lexicográfico de uuid impuesto en la query) con unique, y la lectura busca el id en ambas columnas. Evita el clásico bug de des-sincronización de la fila espejo. `onConflictDoNothing` hace el marcado idempotente. [Source: architecture.md#Resoluciones — tabla perro_compatibilidades]
- **Regla "mismo tutor" en la capa de datos, mensaje en la action.** FR-008: compatibilidad es solo entre perros del mismo tutor (habilita paseos de hasta 3 del MISMO tutor, regla del plan BASE). La query valida (necesita BD, no es motor puro) y lanza; la action traduce a `ErrorNegocio` con mensaje claro. El gate de asignación real (ratio 1-3) vive en 3.x (FR-023) — aquí solo se registra la relación. [Source: prd.md#FR-008, #FR-023]
- **Quitar compatibilidad = DELETE físico, justificado.** Es una relación operativa re-evaluable (los perros cambian), no un dato de negocio histórico — la regla #8 (soft-delete) protege fichas y hechos económicos, no esta relación. Documentar el porqué en el código. Si un perro pasa a `inactivo`, sus compatibilidades pueden quedar (inofensivas: el gate de 3.x filtrará por estado).
- **Foto: primer uso real del pipeline 1.4.** Cliente: `comprimirImagen(file)` (`browser-image-compression` → WebP ≤1600px ≤400KB) → `FormData` → action `subirFotoPerro` (patrón `subirAnexoPdf`: fuera de `crearAction`, `getActor()` manual) → `storage.subirArchivo` con key estable `perros/{id}/foto.webp` (re-subir reemplaza, sin basura en R2) → persistir `fotoKey`. La URL pública se resuelve server-side con `urlPublica()` (aprendizaje 1.5: no usar env vars R2 en cliente). En dev sin R2: no-op, no romper.
- **Taxonomías: enum solo donde el método las fija.** `grupo_raza` (trabajo_guardia/pastora/caza/otro — taxonomía oficial del módulo razas) y `talla` (pequena/mediana/grande, estándar operativo) van como pgEnum; condición física, temperamento, equipamiento y premios quedan **texto libre** (el método no define catálogo — no inventar taxonomías). Los estados emocionales (calma/excitación/estrés/ansiedad-miedo) NO se modelan aquí: son del registro post-paseo (FR-028, Story 4.4). [Source: prd-addendum#Taxonomías]
- **`notas_criticas` es una marca booleana sobre `notas_manejo`** ("notas de manejo con marca de crítica"). El paseador las verá sin scroll en 4.x (UX del paseador) — aquí solo se captura y se señala con ⚠️ en el listado. [Source: epics.md#Story 1.6; project-context.md#UX del paseador]
- **Historial (FR-009) = estados vacíos honestos.** No existen datos de paseos/incidentes/evolución todavía (épicas 3/4) y `paseos` no tiene `perro_id`. La sección se construye con placeholders explícitos; NO agregar columnas especulativas ni consultar `paseos`. [Source: epics.md#Story 1.6 — "estados vacíos mientras no haya paseos"]
- **Edad como entero opcional (años aprox).** El PRD pide "edad"; fecha de nacimiento sería más precisa pero los tutores no siempre la saben. v1: entero 0-30 nullable.

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/schema.ts` — agregar 3 enums + `perros` + `perro_compatibilidades` al final. NO tocar lo existente (boolean ya está importado).
- `src/app/admin/tutores/[id]/page.tsx` — hoy: FormTutor + SeccionEntrevista (grid con `key={tutor.version}`) + SeccionAnexos. Agregar la sección Perros (cargar `listarPerrosDeTutor` en el server). NO romper el remount por version.
- `e2e/global-setup.ts` — hoy limpia anexos→tutores y siembra usuarios. Insertar la limpieza de compatibilidades→perros ANTES de la de anexos/tutores.

### Patrones existentes a reutilizar (NO reinventar)

- **Lock optimista completo**: `queries/tutores.ts` (`actualizarTutor`) + action con `ErrorNegocio(CONFLICTO)` + `key={version}` en la página. Copiar tal cual.
- **Subida binaria**: `actions/tutores.ts#subirAnexoPdf`. **Form cliente**: `components/tutores/form-tutor.tsx` (noValidate + safeParse + selects nativos con `SELECT_CLASS`). **Página con tabla/badge**: `app/admin/tutores/page.tsx`. **Tests**: `actions/tutores.test.ts` (mocks vi.hoisted), `e2e/tutores.spec.ts` (serial, un login, selectores con cuidado del strict mode — aprendizajes: evitar `getByRole('alert')` (announcer de Next) y textos duplicados entre `<option>` y lista → scope con `getByRole('listitem').filter(...)`).
- **Migraciones**: `db:generate` → revisar SQL → `db:migrate`.

### Qué NO hacer (límites de alcance)

- NO tocar la tabla `paseos` (el `perro_id` FK llega en 3.x) ni consultar paseos para el historial.
- NO implementar el gate de ratio 1-3 perros por paseo (FR-023, Story 3.4) — solo registrar compatibilidades.
- NO modelar estados emocionales ni incidentes (4.x) — el historial es placeholder.
- NO crear la ficha del paseador (1.7).
- NO escribir `event_log` ni agregar dependencias.
- NO permitir compatibilidades entre perros de distinto tutor (regla dura del plan BASE).

### Dependencias externas / acción de Nelson

- Ninguna nueva. La foto usa R2 (vars ya anotadas para prod; dev funciona sin ellas con no-op).
- Migración `0005` debe aplicarse a Neon.

### Testing standards

- Vitest unit co-ubicado, node env, mocks `vi.hoisted`/`vi.mock`. E2E desktop serial con un login, datos únicos por corrida + limpieza en global-setup. CI: lint+test+build (E2E local).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6] — ACs fuente (FR-007/008/009)
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md#F0.3, #FR-023, #FR-028] — perfil del perro, ratio, estados emocionales (futuros)
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/addendum.md#Taxonomías del método] — grupos de raza operativos (taxonomía oficial)
- [Source: _bmad-output/planning-artifacts/architecture.md#Resoluciones de brechas, #Addendum Story 1.4] — perro_compatibilidades, convención PK uuid, catálogos
- [Source: labradog-app/src/lib/db/queries/tutores.ts; src/actions/tutores.ts; src/components/tutores/*; e2e/tutores.spec.ts; e2e/global-setup.ts] — patrones exactos de 1.5 (lock optimista, subida binaria, forms, E2E y su limpieza)
- [Source: labradog-app/src/lib/comprimir-imagen.ts; src/lib/storage.ts] — pipeline de foto (1.4)
- [Source: _bmad-output/implementation-artifacts/1-5-ficha-del-tutor-con-entrevista-inicial-y-anexos.md#Dev Agent Record] — aprendizajes: noValidate+safeParse, selectores E2E strict mode, limpieza de datos de test

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-09: Story 1.6 (ficha del perro con compatibilidades e historial) creada con context engine BMAD. Status → ready-for-dev.
