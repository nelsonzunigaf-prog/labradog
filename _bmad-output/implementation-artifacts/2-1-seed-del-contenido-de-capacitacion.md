---
baseline_commit: 554fd0c
---

# Story 2.1: Seed del contenido de capacitación

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a admin,
I want las 9 etapas, el módulo de razas, los tests y el banco de 100 preguntas cargados desde los documentos existentes,
so that el programa completo vive en la plataforma sin transcripción manual.

## Acceptance Criteria

1. **Given** el contenido curado de `labradog-app/scripts/seed-data/capacitacion/` (derivado de los Word de `archivos del proyecto\`), **When** corre el script de seed, **Then** existen las 9 etapas + módulo razas con su contenido navegable (markdown), los tests de etapas 1/2/3/5 con sus 30 preguntas V/F cada uno, y el banco de 100 preguntas del examen con alternativas y correcta (FR-010, FR-013).
2. **And** el seed es **idempotente**: re-ejecutarlo produce **0 filas nuevas** en las tablas de contenido, y **reporta qué cargó** (insertados / actualizados / sin cambios, por tabla).
3. **And** las tablas de contenido siguen los patrones del proyecto: snake_case plural español, `...columnasAuditoria` (actor `'sistema'`), claves naturales únicas que garantizan la idempotencia, enums alimentados por tuplas del motor.
4. **And** un test unitario en CI valida la integridad del contenido fuente: JSON parseables, 4 tests × 30 preguntas, banco de 100 con `correcta` válida, los 10 archivos de contenido y 4 pautas existen y no están vacíos.
5. **And** regresión verde: `npm run lint && npm run test && npm run build` + suite E2E completa; sin dependencias nuevas; migraciones 0000-0006 intactas (la nueva es 0007).

## Tasks / Subtasks

- [ ] Task 1: Catálogo de capacitación en el motor (AC: 3)
  - [ ] Crear `src/lib/engine/capacitacion.ts` (motor puro, SOLO catálogo — las reglas de desbloqueo/scoring llegan en 2.2/2.3 en `certificacion.ts`, NO escribirlas aquí): `export const TIPOS_EVALUACION = ['test', 'practica', 'test_y_practica', 'examen_final'] as const;` + type + `ETIQUETAS_TIPO_EVALUACION: Record<...>` (es-CL: 'Test', 'Evaluación práctica', 'Test + práctica', 'Examen final'). Patrón exacto de `ESPECIALIDADES_CAMINATA` en `fichas.ts`.
  - [ ] Test co-ubicado `capacitacion.test.ts`: cada tipo tiene etiqueta (patrón `fichas.test.ts`).

- [ ] Task 2: Schema — 3 tablas de contenido + migración 0007 (AC: 1, 2, 3)
  - [ ] En `src/lib/db/schema.ts` (al final, después de `paseadores`): `tipoEvaluacionEnum = pgEnum('tipo_evaluacion', TIPOS_EVALUACION)` (importar del motor).
  - [ ] Tabla `etapas`: `id uuid pk defaultRandom`; `numero: integer('numero').notNull().unique()` — **1-10, donde 10 = módulo razas** (clave natural del seed; el desbloqueo secuencial de 2.2 funciona uniforme: 10 se abre al aprobar 9, que es exactamente FR-011); `slug text notNull unique`; `titulo text notNull`; `modulo text notNull` (Fundamentos/Control/.../Evaluación/Razas); `objetivo text notNull`; `duracion text notNull` (texto legible: "15 minutos"); `tipoEvaluacion: tipoEvaluacionEnum('tipo_evaluacion').notNull()`; `esModuloRazas: boolean('es_modulo_razas').notNull().default(false)` (presentación: el 10 se muestra como "Módulo razas", no "Etapa 10"); `contenidoMd: text('contenido_md').notNull()` (markdown navegable); `pautaMd: text('pauta_md')` (nullable — solo etapas 4/6/7/8 la tienen; es la guía que el admin evaluador ve en 2.4); `...columnasAuditoria`. **SIN `columnaVersion`**: el contenido se gestiona por seed (re-ejecutar actualiza), no por edición multi-admin — documentar en comentario.
  - [ ] Tabla `preguntas_etapa` (tests V/F de etapas 1/2/3/5): `id uuid pk`; `etapaId: uuid('etapa_id').notNull().references(() => etapas.id, { onDelete: 'restrict' })`; `orden integer notNull` (1-30, posición en el test); `unidad text notNull` (sección temática, para feedback por pregunta en 2.3); `texto text notNull`; `respuesta boolean notNull` (V/F); `...columnasAuditoria`; unique `('preguntas_etapa_etapa_orden_uq').on(etapaId, orden)` — clave de idempotencia.
  - [ ] Tabla `preguntas_examen` (banco 100): `id uuid pk`; `numero integer notNull unique` (1-100, clave de idempotencia); `categoria text notNull`; `texto text notNull`; `alternativas: text('alternativas').array().notNull()` (3 textos); `correcta integer notNull` (índice 0-based); `...columnasAuditoria`; CHECK `('preguntas_examen_correcta_rango', sql\`${t.correcta} >= 0 AND ${t.correcta} <= 2\`)` (patrón `check()` de 1.7, API verificada en drizzle 0.45).
  - [ ] NO crear tablas de avance/intentos/certificación (llegan en 2.2/2.3/2.6 — no inventar el modelo de progreso).
  - [ ] `npm run db:generate` → `drizzle/0007_*.sql`; revisar SQL (enum, 3 tablas, uniques, CHECK, FK restrict); `npm run db:migrate` a Neon.

- [ ] Task 3: Script de seed idempotente `scripts/seed-capacitacion.mjs` (AC: 1, 2)
  - [ ] **Patrón `crear-admin.mjs`** (precedente del proyecto): `.mjs` + `import 'dotenv/config'` + `neon(process.env.DATABASE_URL)` + SQL crudo. NO `.ts`: el proyecto no tiene runner de TS para scripts standalone y NO se agregan dependencias (variación documentada vs architecture.md que decía `.ts` — registrarla en el Dev Agent Record).
  - [ ] Leer fuentes con `node:fs` relativo al script (`new URL('./seed-data/capacitacion/...', import.meta.url)`): `programa.json` (manifest), `etapas/*.md` (contenido), `pautas/*.md`, `tests.json`, `banco-examen.json`.
  - [ ] Armar las 10 filas de `etapas`: las 9 del manifest (numero = `numero`) + módulo razas (numero = **10**, `es_modulo_razas = true`, datos de `programa.json#modulo_razas`). `contenido_md` = contenido del `.md` referenciado; `pauta_md` = contenido del archivo en `archivo_pauta` (solo 4/6/7/8).
  - [ ] **Upsert por clave natural** (estrategia de idempotencia): `INSERT ... ON CONFLICT (numero) DO UPDATE SET titulo=..., contenido_md=..., ..., updated_at=now(), updated_by='sistema' WHERE <alguna columna difiere>` — así re-ejecutar tras corregir un `.md` actualiza contenido SIN filas nuevas, y un re-run sin cambios reporta 0/0. Mismo patrón para `preguntas_etapa` (conflicto en `(etapa_id, orden)`) y `preguntas_examen` (conflicto en `numero`). `created_by/updated_by = 'sistema'` (ActorEvento 'sistema', precedente crear-admin.mjs).
  - [ ] **Reporte obligatorio (AC2)**: al final imprimir por tabla `insertadas / actualizadas / sin cambios` y totales esperados (10 etapas, 120 preguntas de test, 100 de examen). Usar `RETURNING` + `xmax = 0` (insert) vs `xmax <> 0` (update) o conteo previo/posterior — lo que sea verificable.
  - [ ] **Validación previa al INSERT** (fail-fast, exit 1 sin tocar BD si falla): 4 tests con 30 preguntas c/u; 100 preguntas de examen con `correcta` 0-2 y 3 alternativas; 10 contenidos no vacíos; etapas con test (1/2/3/5) presentes en `tests.json`.
  - [ ] Auditoría: si hubo cambios (insertadas+actualizadas > 0), un INSERT crudo a `event_log` (`tipo: 'capacitacion_seed_ejecutado'`, `entidad: 'etapas'`, `entidad_id: 'seed'`, payload con los conteos, actor `'sistema'`/`'sistema'`) — precedente crear-admin.mjs. Si fue no-op, NO escribir evento (re-runs limpios no ensucian el log).
  - [ ] Guard de confirmación NO necesario (no es destructivo — solo upsert de catálogo), pero exigir `DATABASE_URL` definida con mensaje claro (patrón existente).
  - [ ] Agregar npm script: `"db:seed-capacitacion": "node scripts/seed-capacitacion.mjs"`.

- [ ] Task 4: Test de integridad del contenido en CI (AC: 4)
  - [ ] `src/lib/engine/capacitacion-contenido.test.ts` (vitest, lee `scripts/seed-data/capacitacion/` con `node:fs` + `path.resolve(__dirname, ...)` — verificar que la ruta funciona desde la raíz del app donde corre vitest): `programa.json` parsea y tiene 9 etapas + `modulo_razas`; cada `archivo_contenido`/`archivo_pauta` referenciado existe y no está vacío; `tests.json` tiene exactamente los tests de etapas 1/2/3/5 con 30 preguntas c/u y `respuesta` boolean; `banco-examen.json` tiene 100 preguntas, números 1-100 únicos, 3 alternativas y `correcta` entre 0-2; `tipo_evaluacion` de cada etapa ∈ `TIPOS_EVALUACION`.
  - [ ] Este test es el guardarraíl de CI: si alguien edita mal un JSON/md curado, CI rompe ANTES de que el seed llegue a Neon.

- [ ] Task 5: Ejecutar el seed y verificar idempotencia real (AC: 1, 2)
  - [ ] Correr `npm run db:seed-capacitacion` contra Neon → reporte: 10 etapas, 120 preguntas_etapa, 100 preguntas_examen insertadas.
  - [ ] **Correr de nuevo** → reporte: 0 insertadas, 0 actualizadas (o solo "sin cambios") — evidencia del AC2 en el Dev Agent Record.
  - [ ] Verificar en BD (patrón `db-inspect.mjs` o query directa): conteos exactos, etapa 10 con `es_modulo_razas = true`, etapa 5 con `tipo_evaluacion = 'test_y_practica'`, pauta_md NOT NULL solo en 4/6/7/8.

- [ ] Task 6: Regresión final (AC: 5)
  - [ ] `npm run lint && npm run test && npm run build` verdes (101+ unit existentes + los nuevos).
  - [ ] Suite E2E completa verde (no hay E2E nuevo: esta story no tiene UI — la navegación llega en 2.2).

## Dev Notes

### Contexto y alcance

Primera story del Epic 2. Es una story de **datos, no de UI**: deja el programa completo de capacitación viviendo en Postgres para que 2.2 (navegación), 2.3 (tests), 2.4 (pautas para evaluadores) y 2.5 (examen) solo lean. El contenido ya fue **curado previamente** (jun-2026) desde los Word a `labradog-app/scripts/seed-data/capacitacion/` — esta story NO procesa .docx: consume los archivos curados y versionados. [Source: epics.md#Story 2.1; scripts/seed-data/capacitacion/README.md]

### Decisiones de diseño clave (leer antes de implementar)

- **El contenido curado es la fuente; los Word son referencia humana.** `scripts/seed-data/capacitacion/` contiene: `programa.json` (manifest con etapas, duraciones, tipos de evaluación y principios), `etapas/*.md` (10 contenidos), `tests.json` (4 tests × 30 V/F con `unidad`), `banco-examen.json` (100 preguntas, `correcta` **0-based**), `pautas/*.md` (4 pautas prácticas) y `README.md` con las decisiones editoriales (duración total 2–3 h por indicación de Nelson; módulo razas tras etapa 9 por FR-011; preguntas 3 y 69 del banco reformuladas por ambigüedad). **Leer ese README antes de tocar nada.**
- **Módulo razas = numero 10 en `etapas`.** El documento original lo ubicaba entre etapas 3 y 4, pero FR-011 lo desbloquea al aprobar la 9 → modelarlo como numero 10 hace que la regla secuencial de 2.2 sea uniforme (N se abre al aprobar N-1) sin caso especial. `es_modulo_razas` existe SOLO para presentación ("Módulo razas", no "Etapa 10"). [Source: epics.md#Story 2.2 — FR-011; seed-data/capacitacion/programa.json#modulo_razas.nota_fuente]
- **Idempotencia = upsert por clave natural + reporte.** Claves: `etapas.numero`, `preguntas_etapa(etapa_id, orden)`, `preguntas_examen.numero`. `ON CONFLICT ... DO UPDATE` permite corregir contenido re-ejecutando (0 filas nuevas siempre); el reporte insertadas/actualizadas/sin-cambios hace el AC verificable. Mismo espíritu que la materialización idempotente de 3.2 (unique constraint garantiza incluso ejecuciones concurrentes).
- **`.mjs`, no `.ts` — variación consciente de architecture.md.** La arquitectura menciona `scripts/seed-capacitacion.ts`, pero el proyecto NO tiene runner de TS standalone (no hay `tsx`; Node 20 no ejecuta TS) y la regla #3 del enforcement prohíbe dependencias nuevas sin registro. El precedente establecido son los 5 scripts `.mjs` de `labradog-app/scripts/` con `neon()` + SQL crudo (`crear-admin.mjs` es el modelo: dotenv, validación de env, transacción, event_log con actor 'sistema'). Registrar la variación en el Dev Agent Record y en architecture.md si se considera estructural.
- **Sin `columnaVersion` en tablas de contenido.** El lock optimista es para edición multi-admin; este contenido se administra re-ejecutando el seed (un solo escritor: 'sistema'). Si en el futuro se edita contenido desde la UI, esa story agregará la columna. No anticiparlo.
- **Sin tablas de progreso.** `avance`, `intentos_test`, `certificaciones` etc. los definen 2.2/2.3/2.6 con sus reglas. Crear solo las 3 tablas de CONTENIDO. El badge "Sin certificar" de 1.7 sigue derivado hasta 2.6.
- **`tipo_evaluacion` por etapa** (del manifest): 1/2/3 = `test`, 4 = `practica`, 5 = `test_y_practica`, 6/7/8 = `practica`, 9 = `examen_final`, 10 (razas) = `practica`. Las pautas (`pauta_md`) viven en la etapa porque 2.4 las muestra "a la vista" del evaluador al registrar veredicto. [Source: epics.md#Story 2.3 (tests 1/2/3/5), #Story 2.4 (pauta correspondiente), #Story 2.5 (banco)]
- **Scoring NO es de esta story**: la regla 80% exacto sin redondeo y el contrato de selección aleatoria con seed persistida los define 2.3 (contrato diferido en project-context.md — no improvisar antes).

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/schema.ts` — hoy termina en la tabla `paseadores` (con CHECK, patrón a imitar). Agregar enum + 3 tablas al final. El import de `drizzle-orm/pg-core` ya trae `check`, `unique`, `boolean`, `integer`.
- `package.json` — agregar solo el script `db:seed-capacitacion`. NADA más (cero dependencias nuevas).
- `scripts/seed-data/capacitacion/*` — NO editar el contenido curado en esta story (si el dev detecta un defecto de datos, reportarlo, no parcharlo silenciosamente).

### Patrones existentes a reutilizar (NO reinventar)

- **Script BD**: `scripts/crear-admin.mjs` (dotenv, neon, validaciones, event_log crudo con actor 'sistema', mensajes ✅/❌). **Inspección**: `scripts/db-inspect.mjs`. **Tupla→pgEnum**: `fichas.ts#ESPECIALIDADES_CAMINATA` → `schema.ts#especialidadCaminataEnum`. **CHECK**: `schema.ts#paseadores_comision_rango`. **Unique compuesto**: `paseos_recurrencia_fecha_uq`, `perro_compat_par_uq`. **Test de catálogo**: `fichas.test.ts`.
- **Array de text en drizzle**: `text('alternativas').array().notNull()` — mismo mecanismo que `red_flags`/`especialidades` pero sin enum (las alternativas son texto libre).

### Qué NO hacer (límites de alcance)

- NO UI (`/paseador/mi-capacitacion`, `/admin/capacitacion`) — Story 2.2/2.7.
- NO motor de desbloqueo ni scoring (`lib/engine/certificacion.ts`) — Story 2.2/2.3 (2.2 define el patrón Engine con su test de delegación).
- NO tablas de avance/intentos/certificación ni gate de asignación — 2.2/2.3/2.6.
- NO parsear .docx (python/pandoc/mammoth) — el contenido ya está curado y versionado.
- NO dependencias nuevas (ni `tsx`, ni `gray-matter`: el manifest ya es JSON y los .md se leen como texto plano).
- NO editar el contenido curado (es la fuente aprobada por Nelson).

### Dependencias externas / acción de Nelson

- Ninguna nueva. Migración `0007` + seed a Neon (el dev los corre con `DATABASE_URL` del `.env` local, como siempre).

### Testing standards

- Vitest co-ubicado (`src/lib/engine/*.test.ts`); el test de integridad de contenido (Task 4) corre en CI con lint+test+build. Sin E2E nuevo (sin UI). Verificación manual del AC2 documentada en Dev Agent Record (salida de las 2 corridas del seed).

### Project Structure Notes

- `scripts/seed-capacitacion.mjs` junto a los demás scripts operativos del app (`labradog-app/scripts/`); los datos en `scripts/seed-data/capacitacion/` (ya existen). Variación `.mjs` vs `.ts` de architecture.md documentada arriba.
- Tablas nuevas en el ÚNICO `schema.ts` (regla del proyecto), snake_case plural español: `etapas`, `preguntas_etapa`, `preguntas_examen`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — ACs fuente; #Story 2.2/2.3/2.4/2.5 — consumidores del contenido
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md#FR-010→018] — programa, tests, banco, certificación
- [Source: _bmad-output/planning-artifacts/architecture.md#Máquina de estados de capacitación] — "trabajo de seeding de datos, no de código"; #Estructura (scripts/seed-capacitacion)
- [Source: labradog-app/scripts/seed-data/capacitacion/README.md] — estructura del contenido curado y decisiones editoriales
- [Source: labradog-app/scripts/crear-admin.mjs] — patrón de script .mjs con neon + event_log
- [Source: labradog-app/src/lib/db/schema.ts#paseadores] — patrón CHECK + tupla→pgEnum + columnasAuditoria
- [Source: _bmad-output/implementation-artifacts/1-7-ficha-del-paseador.md#Dev Agent Record] — aprendizajes (verificar APIs de drizzle contra node_modules instalado)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-12: Story 2.1 (seed del contenido de capacitación) creada con context engine BMAD. Contenido ya curado en scripts/seed-data/capacitacion/ (sesión 2026-06-11). Status → ready-for-dev.
