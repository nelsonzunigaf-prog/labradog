---
baseline_commit: e3a740f
---

# Story 1.4: Fundaciones transversales — almacenamiento, fechas y estados del paseo

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a desarrollador IA de las épicas siguientes,
I want los módulos transversales que múltiples stories consumen, definidos una sola vez,
so that las épicas 3-5 no descubren dependencias ni migraciones a mitad de implementación.

## Acceptance Criteria

1. **Given** el scaffold de 1.1, **When** se implementa `src/lib/storage.ts`, **Then** existe un helper de subida a Cloudflare R2 (API S3-compatible) con **reintento ante fallo de red**, aislado como ÚNICA frontera con R2 (ningún otro archivo importa el SDK de S3), con test; **And** existe una utilidad de **compresión en cliente** (`src/lib/comprimir-imagen.ts`) con defaults del método (salida JPEG/WebP, lado mayor ≤1600px, ≤400KB), con test.
2. **And** sin credenciales de R2 en el entorno, `storage.ts` degrada con no-op + `console.warn` (mismo patrón que `email.ts`), nunca rompe el flujo en dev.
3. **Given** la necesidad de agenda recurrente, **When** se implementa `src/lib/fechas.ts`, **Then** existe la utilidad central de zona horaria `America/Santiago` (conversión UTC↔hora local por fecha, **inmune a DST**) + lista de feriados de Chile, con tests que verifican los **2 cambios de hora de 2026** (fin de verano sáb 4-abr-2026, inicio de verano sáb 5-sep-2026) y un feriado conocido.
4. **Given** que 3.x/4.x/5.x comparten el ciclo de vida del paseo, **When** se implementa `src/lib/engine/paseo-estados.ts`, **Then** la **máquina de estados del paseo** es un artefacto único y puro: estados (`pendiente → checklist_completa → en_curso → completado | cancelado`) y transiciones permitidas con guardas, exportada para consumo de 3.x/4.x/5.x, con tests que **rechazan toda transición inválida**.
5. **And** la tabla `paseos` se crea aquí con: snapshot económico (`precio_clp_snapshot`, `comision_pct_snapshot`, **nullable** hasta poblarse en 3.2/4.x), `version` para lock optimista (`...columnaVersion`), columnas de auditoría (`...columnasAuditoria`), `estado` (pgEnum `estado_paseo`, default `'pendiente'`) y **unique constraint `(recurrencia_id, fecha_local)`** (garantiza la materialización idempotente de 3.2 incluso ante ejecuciones concurrentes).
6. **And** regresión verde: `npm run lint && npm run test && npm run build`; no se rompe ninguna tabla/migración existente; cada dependencia nueva queda registrada en `architecture.md` (enforcement #3).

## Tasks / Subtasks

- [x] Task 1: Dependencias nuevas + registro en architecture.md (AC: 1, 3, 6)
  - [x] Instalar en `labradog-app/`: `npm install @date-fns/tz date-fns browser-image-compression @aws-sdk/client-s3`. (4 deps; `@date-fns/tz` aporta `TZDate` DST-safe, `date-fns` formateo/aritmética, `browser-image-compression` compresión cliente, `@aws-sdk/client-s3` R2 S3-compatible.)
  - [x] **Verificar las APIs reales contra los tipos instalados en `node_modules` antes de codear** (regla del proyecto: no programar de memoria). En particular: firma de `new TZDate(...)` y `tz()` en `node_modules/@date-fns/tz/*.d.ts`; opciones de `imageCompression` en `node_modules/browser-image-compression/dist/*.d.ts`; `S3Client`/`PutObjectCommand` en `node_modules/@aws-sdk/client-s3/dist-types/*.d.ts`.
  - [x] Registrar las 4 dependencias con su rationale en `_bmad-output/planning-artifacts/architecture.md` (sección de stack o un addendum "Story 1.4"): por qué cada una y su alternativa descartada. Sin este registro la story NO está completa (enforcement #3).
  - [x] Agregar a `labradog-app/.env.example` las variables de R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`. NO commitear secretos reales.

- [x] Task 2: `src/lib/storage.ts` — frontera única con R2 (AC: 1, 2)
  - [x] Crear `src/lib/storage.ts` (server-only). Cliente S3 perezoso (lazy singleton) configurado para R2: `region: 'auto'`, `endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credenciales de las env vars. NO instanciar el cliente a nivel de módulo si faltan credenciales.
  - [x] Exportar `async function subirArchivo({ key, contenido, contentType }: { key: string; contenido: Uint8Array | Buffer; contentType: string }): Promise<{ url: string }>`. Usa `PutObjectCommand`. **Reintento ante fallo de red**: envolver el `send()` en un retry corto (p.ej. 3 intentos con backoff lineal) que reintente solo errores de red/5xx, no 4xx. Devolver `{ url: \`${R2_PUBLIC_URL}/${key}\` }`.
  - [x] **Degradación dev sin credenciales** (AC2): si falta cualquiera de las env vars de R2 → `console.warn('[storage] R2 no configurado: subida omitida (dev)')` y retornar una URL placeholder (`{ url: \`${R2_PUBLIC_URL ?? ''}/${key}\` }` o similar), sin lanzar. Espejo exacto del patrón no-op de `src/lib/email.ts`.
  - [x] Exportar helper `urlPublica(key: string): string`. Mantener TODO el SDK de `@aws-sdk/client-s3` confinado a este archivo (regla #12 de capas: ningún otro archivo lo importa).
  - [x] Test `src/lib/storage.test.ts` (Vitest, node, mockear `@aws-sdk/client-s3`): (a) con credenciales, `subirArchivo` llama `PutObjectCommand` con `{ Bucket, Key, Body, ContentType }` correctos y `S3Client.send`; (b) **reintento**: `send` falla 1 vez (error de red) y luego resuelve → `subirArchivo` resuelve sin lanzar y se llamó 2 veces; (c) sin credenciales → no instancia cliente, hace warn y no lanza. Setear las env vars vía `vi.stubEnv` por caso.

- [x] Task 3: `src/lib/comprimir-imagen.ts` — compresión en cliente (AC: 1)
  - [x] Crear `src/lib/comprimir-imagen.ts` con `'use client'`-friendly export (es un util importable por componentes cliente; no marcar el módulo como server). Exportar `async function comprimirImagen(file: File): Promise<File>` que llama `imageCompression(file, OPCIONES_FOTO)` de `browser-image-compression`.
  - [x] Exportar la constante `OPCIONES_FOTO = { maxSizeMB: 0.4, maxWidthOrHeight: 1600, fileType: 'image/webp', useWebWorker: true } as const` (≤400KB, lado mayor ≤1600px, salida WebP). Documentar que estos son los defaults del método (concern #6 de architecture: fotos comprimidas para redes lentas).
  - [x] Test `src/lib/comprimir-imagen.test.ts` (mockear `browser-image-compression`): `comprimirImagen` invoca `imageCompression` con `OPCIONES_FOTO` y devuelve su resultado. (No probar el pipeline de canvas real: requiere DOM; basta verificar el contrato de opciones.)

- [x] Task 4: `src/lib/fechas.ts` — zona horaria Santiago + feriados (AC: 3)
  - [x] Crear `src/lib/fechas.ts`. Constante `ZONA = 'America/Santiago'`.
  - [x] `aInstanteUtc(fechaLocal: string, hora?: string): Date` — recibe fecha local `'YYYY-MM-DD'` (+ hora opcional `'HH:mm'`, default `'00:00'`) en horario de Santiago y devuelve el `Date` (instante UTC) correcto, **inmune a DST**. Implementar con `TZDate` de `@date-fns/tz` (construye el instante interpretando los componentes en la zona dada). Verificar la firma exacta en los tipos instalados.
  - [x] `aFechaLocal(instante: Date): string` — devuelve `'YYYY-MM-DD'` de la fecha local Santiago de un instante UTC (para calcular `fecha_local` y la unique de materialización). Usar `TZDate`/`Intl.DateTimeFormat('en-CA', { timeZone: ZONA })` (en-CA da formato ISO).
  - [x] `formatearLocal(instante: Date, formato?: string): string` — render legible en hora Santiago (para UI). Usar `date-fns` `format` sobre un `TZDate` en la zona.
  - [x] Feriados: `FERIADOS_CL: Record<string, string>` mapeando `'YYYY-MM-DD' → nombre` para **2026 y 2027** (incluir al menos: Año Nuevo 01-01, Viernes Santo —móvil, 2026-04-03 y 2027-03-26—, Día del Trabajo 05-01, Glorias Navales 05-21, Día de los Pueblos Indígenas 06-20/21 —móvil—, San Pedro y San Pablo —móvil—, Virgen del Carmen 07-16, Asunción 08-15, Independencia 09-18, Glorias del Ejército 09-19, Encuentro de Dos Mundos 10-12 —móvil—, Reforma Evangélica 10-31, Todos los Santos 11-01, Inmaculada Concepción 12-08, Navidad 12-25). Documentar que los feriados móviles van fijados por año (no se computa Pascua) y que la tabla se **extiende anualmente** (deuda técnica anotada). `esFeriado(fechaLocal: string): boolean` consulta el mapa.
  - [x] Test `src/lib/fechas.test.ts` (node, sin mocks — conversión real vía ICU de Node 22):
    - **Verano (UTC−3)**: `aInstanteUtc('2026-01-15', '12:00')` → `2026-01-15T15:00:00.000Z` (offset −3).
    - **Invierno (UTC−4)**: `aInstanteUtc('2026-07-15', '12:00')` → `2026-07-15T16:00:00.000Z` (offset −4).
    - **Borde fin de verano (sáb 4-abr-2026)**: una fecha local del 3-abr es −3 y una del 5-abr es −4 (probar `aInstanteUtc` a ambos lados y/o `aFechaLocal` de los instantes equivalentes). Confirma DST-immunity en el cambio.
    - **Borde inicio de verano (sáb 5-sep-2026)**: una fecha local del 4-sep es −4 y una del 6-sep es −3.
    - **Round-trip**: `aFechaLocal(aInstanteUtc('2026-07-15','12:00')) === '2026-07-15'`.
    - **Feriados**: `esFeriado('2026-09-18') === true`; `esFeriado('2026-09-17') === false`.

- [x] Task 5: `src/lib/engine/paseo-estados.ts` — máquina de estados pura (AC: 4)
  - [x] Crear `src/lib/engine/paseo-estados.ts`. Exportar la tupla fuente de verdad: `export const ESTADOS_PASEO = ['pendiente', 'checklist_completa', 'en_curso', 'completado', 'cancelado'] as const;` y `export type EstadoPaseo = (typeof ESTADOS_PASEO)[number];`.
  - [x] `export const TRANSICIONES: Record<EstadoPaseo, readonly EstadoPaseo[]>` = `{ pendiente: ['checklist_completa', 'cancelado'], checklist_completa: ['en_curso', 'cancelado'], en_curso: ['completado', 'cancelado'], completado: [], cancelado: [] }`. (Cancelar permitido desde cualquier estado no terminal; `completado` y `cancelado` son terminales.)
  - [x] `export function puedeTransicionar(desde: EstadoPaseo, hacia: EstadoPaseo): boolean` (pura). `export function transicionar(desde: EstadoPaseo, hacia: EstadoPaseo): EstadoPaseo` — devuelve `hacia` si es válida; si no, **lanza** `Error` claro (p.ej. `Transición inválida: ${desde} → ${hacia}`). NO usar `ErrorNegocio` aquí (eso vive en la capa action; el motor es puro sin dependencias de capas superiores). `export function esTerminal(estado: EstadoPaseo): boolean`.
  - [x] Motor **puro, sin I/O** (regla #2). Tests co-ubicados `src/lib/engine/paseo-estados.test.ts`: (a) todas las transiciones válidas pasan; (b) **toda** transición inválida (producto cartesiano `ESTADOS_PASEO × ESTADOS_PASEO` menos las válidas) → `puedeTransicionar` false y `transicionar` lanza; (c) `esTerminal` correcto para los 5 estados.

- [x] Task 6: Tabla `paseos` en schema + migración (AC: 4, 5)
  - [x] En `src/lib/db/schema.ts`: definir `export const estadoPaseoEnum = pgEnum('estado_paseo', ESTADOS_PASEO)` importando `ESTADOS_PASEO` desde `../engine/paseo-estados` (la tupla pura es la fuente única; evita desincronización enum DB ↔ tipo TS). `pgEnum` se importa de `drizzle-orm/pg-core`.
  - [x] Definir `export const paseos = pgTable('paseos', { ... }, (t) => [...])` con columnas:
    - `id: uuid('id').primaryKey().defaultRandom()` — **convención nueva para tablas de negocio: PK `uuid` con `gen_random_uuid()`** (las entidades aparecen en URLs `paseo/[id]`; `user` es text/uuid de Better Auth, `event_log` es bigserial por ser log). Registrar esta convención en architecture.md (Task 1).
    - `recurrenciaId: uuid('recurrencia_id')` — **nullable** (los puntuales de 3.3 no tienen recurrencia; la FK a `recurrencias` se agrega en 3.1 cuando exista esa tabla — por ahora columna sin constraint FK).
    - `fechaLocal: date('fecha_local').notNull()` — fecha local Santiago `'YYYY-MM-DD'` (la calcula `lib/fechas.aFechaLocal`).
    - `estado: estadoPaseoEnum('estado').notNull().default('pendiente')`.
    - `precioClpSnapshot: integer('precio_clp_snapshot')` — **nullable** (se congela en 3.2/4.x; entero CLP, regla #5).
    - `comisionPctSnapshot: integer('comision_pct_snapshot')` — **nullable** (porcentaje entero 0-100; se fija al completar en 5.x; semántica final la define Epic 5).
    - `...columnaVersion` (lock optimista, regla #9).
    - `...columnasAuditoria` (regla #7).
  - [x] Unique constraint en el 2º arg del `pgTable`: `unique('paseos_recurrencia_fecha_uq').on(t.recurrenciaId, t.fechaLocal)` (importar `unique` de `drizzle-orm/pg-core`). **NO** usar `NULLS NOT DISTINCT`: los puntuales (recurrencia_id NULL) deben poder coexistir; el comportamiento default de Postgres (NULLs distintos) es el correcto y deseado.
  - [x] Generar y aplicar migración: `npm run db:generate` (crea `drizzle/0003_*.sql`) y revisar el SQL (debe crear el type enum `estado_paseo`, la tabla `paseos` y el índice unique). Aplicar con `npm run db:migrate` contra Neon. Verificar que las migraciones 0000-0002 siguen intactas.
  - [x] **Alcance mínimo intencional**: la tabla NO incluye `paseador_id`/`perro_id`/`tutor_id`/`programado_para` todavía — esas columnas y sus FKs llegan vía `ALTER TABLE` en 3.x/4.x cuando existan sus tablas. Documentarlo en Dev Notes para que el dev no las invente aquí.

- [x] Task 7: Validación final y regresión (AC: 6)
  - [x] `npm run lint && npm run test && npm run build` verdes. Los nuevos tests (storage, comprimir-imagen, fechas, paseo-estados) corren en Vitest node.
  - [x] Confirmar que no se rompió ninguna migración ni tabla existente (event_log, user/session/account/verification) y que el build de Next 16 typecheckea con las nuevas deps.
  - [x] NO hay UI ni E2E en esta story (es puramente fundacional; sin flujo de usuario que probar a mano). Dejar constancia en Completion Notes.

## Dev Notes

### Por qué esta story existe (contexto)

Es una story de **fundaciones**: no entrega UI ni un flujo de usuario, sino los 4 módulos transversales que las épicas 3-5 consumen para no descubrir dependencias ni migraciones a mitad de camino. Cada pieza es un **contrato diferido** que el `project-context.md` ya anuncia (`lib/fechas.ts`, `lib/engine/paseo-estados.ts`, snapshot de `paseos`). [Source: labradog-app/project-context.md#Contratos diferidos; epics.md#Story 1.4]

### Decisiones de diseño clave (leer antes de implementar)

- **No programar APIs de memoria.** Las 4 deps son nuevas en el repo. Tras `npm install`, **leer los `.d.ts` instalados** para `TZDate`/`tz` (`@date-fns/tz`), `imageCompression` (`browser-image-compression`), `S3Client`/`PutObjectCommand` (`@aws-sdk/client-s3`) y codear contra esos tipos. [Source: labradog-app/AGENTS.md; project-context.md enforcement]
- **Compresión vs subida = dos archivos por la frontera de capas.** R2 es server-side y sus secretos no pueden ir al cliente → `storage.ts` (server, SDK S3) hace la subida; la compresión es de navegador → `comprimir-imagen.ts` (util cliente, `browser-image-compression`). El AC junta ambos conceptos bajo "almacenamiento" pero deben quedar separados: `storage.ts` es la **única** frontera con R2 (regla #12). [Source: project-context.md#12; architecture.md#Architectural Boundaries]
- **R2 = API S3.** Cloudflare R2 expone una API S3-compatible: se usa `@aws-sdk/client-s3` con `endpoint` de R2 y `region:'auto'`. Es el SDK más documentado (NFR-07). Alternativa descartada: `aws4fetch` (más liviano pero menos documentado); registrar la decisión en architecture.md. [Source: architecture.md#Infrastructure; research jun-2026]
- **Degradación sin credenciales (patrón `email.ts`).** En dev sin R2, `storage.ts` hace `console.warn` + no-op (no lanza), igual que `email.ts` sin `RESEND_API_KEY`. Así los flujos consumidores (4.x) no se caen en local. [Source: labradog-app/src/lib/email.ts]
- **DST-immunity con `TZDate`, no con offsets hardcodeados.** Chile cambia de hora 2 veces al año (verano UTC−3, invierno UTC−4). Nunca sumar/restar offsets fijos: `TZDate` (de `@date-fns/tz`) interpreta los componentes de fecha/hora en la zona IANA y deja que la base tz resuelva el offset correcto por instante. Esto es exactamente lo que la materialización de paseos (3.2: "cálculo en hora local convertido a UTC por ocurrencia, inmune a DST") necesita. **2026: fin de verano sáb 4-abr (−3→−4), inicio de verano sáb 5-sep (−4→−3).** [Source: architecture.md#Resoluciones de brechas; research jun-2026 — 24horas.cl, meteored.cl]
- **Feriados: tabla por año, sin computus de Pascua.** Para v1, `FERIADOS_CL` es un mapa `'YYYY-MM-DD'→nombre` mantenido a mano para 2026-2027 (incluye los móviles ya resueltos por año, p.ej. Viernes Santo 2026-04-03). Implementar el cálculo de Pascua/feriados móviles sería sobre-ingeniería para el volumen actual; se anota como deuda técnica (extender anualmente). El motor de recurrencia (3.x) será el consumidor. [Source: epics.md#Story 1.4 — "tabla/lista de feriados CL"]
- **Máquina de estados = artefacto ÚNICO y puro.** Vive en `lib/engine/paseo-estados.ts` (motor sin I/O). La tupla `ESTADOS_PASEO` es la **fuente única**: el `pgEnum('estado_paseo', ESTADOS_PASEO)` la importa, evitando que el enum de BD y el tipo TS se desincronicen. Cancelar se permite desde cualquier estado no terminal (un incidente puede abortar un paseo `en_curso`); `completado` y `cancelado` son terminales. La validación de guardas de negocio (¿checklist hecha? ¿hora válida?) vive en las stories consumidoras (4.x), no aquí: el motor solo valida que la **transición** sea legal. [Source: project-context.md#Contratos diferidos; epics.md#Story 1.4]
- **`paseos` con PK `uuid` (convención nueva).** Es la primera tabla de negocio del proyecto, así que fija la convención: PK `uuid().defaultRandom()` (`gen_random_uuid()`), porque las entidades aparecen en URLs (`paseo/[id]`) y uuid evita filtrar volumen vía ids secuenciales. (`user` usa text de Better Auth; `event_log` usa bigserial por ser un log append-only — no entran en conflicto.) Registrar la convención en architecture.md. [Source: schema.ts actual; architecture.md#Data Architecture]
- **Tabla mínima a propósito.** Solo las columnas que el AC exige + `estado` + `fecha_local`. Las FKs a `recurrencias` (3.1), `perros` (1.6), `tutores` (1.5), `paseadores` (1.7) y campos como `programado_para` se agregan por `ALTER TABLE` cuando esas tablas existan. No inventar columnas especulativas. La unique `(recurrencia_id, fecha_local)` con `recurrencia_id` nullable es correcta: los puntuales (NULL) coexisten porque Postgres trata NULLs como distintos. [Source: architecture.md#Resoluciones de brechas — clave única materialización]

### Archivos que se CREAN

- `src/lib/storage.ts` (server, frontera R2) + `src/lib/storage.test.ts`
- `src/lib/comprimir-imagen.ts` (util cliente) + `src/lib/comprimir-imagen.test.ts`
- `src/lib/fechas.ts` + `src/lib/fechas.test.ts`
- `src/lib/engine/paseo-estados.ts` (motor puro) + `src/lib/engine/paseo-estados.test.ts`
- `drizzle/0003_*.sql` (migración generada)

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/schema.ts` — hoy define `columnasAuditoria`, `columnaVersion`, `event_log`, `user`, `session`, `account`, `verification` (sin `pgEnum`, sin `paseos`). Agregar el import de `pgEnum`/`unique`/`uuid`/`date`/`integer` desde `drizzle-orm/pg-core` (varios ya están importados — revisar), el `estadoPaseoEnum` y la tabla `paseos`. NO tocar las tablas existentes.
- `labradog-app/.env.example` — agregar las 5 vars de R2.
- `labradog-app/package.json` — 4 deps nuevas (vía `npm install`).
- `_bmad-output/planning-artifacts/architecture.md` — addendum con las decisiones de dependencias + convención PK uuid.

### Patrones existentes a reutilizar (NO reinventar)

- **Tests Vitest** (node, co-ubicados `*.test.ts`): patrón de mocks con `vi.mock`, `vi.hoisted`, `vi.fn`, `beforeEach(() => vi.clearAllMocks())` — ver `src/lib/db/eventos.test.ts`. Para env vars en tests, `vi.stubEnv`. [Source: labradog-app/vitest.config.ts; eventos.test.ts]
- **No-op sin credenciales**: copiar la forma de `src/lib/email.ts` (warn + early return) para `storage.ts`.
- **Helpers de schema**: componer `...columnasAuditoria` y `...columnaVersion` tal como están definidos en `schema.ts` (spread dentro del objeto de columnas de `pgTable`).
- **Migraciones**: `npm run db:generate` → revisar el `.sql` en `drizzle/` → `npm run db:migrate`. Config en `drizzle.config.ts` (dialect postgresql, schema apunta a `schema.ts`). [Source: drizzle.config.ts; drizzle/0000-0002]

### Qué NO hacer (límites de alcance)

- NO crear UI, componentes, actions ni rutas. Esta story es fundacional pura.
- NO agregar FKs ni columnas a `paseos` para tablas que aún no existen (recurrencias/perros/tutores/paseadores). Llegan en sus stories vía ALTER.
- NO implementar la cola offline (`lib/offline-queue.ts` es Story 4.2) ni la materialización idempotente (Story 3.2) ni el motor de recurrencia (3.1) — solo se crea la unique constraint que 3.2 explotará.
- NO implementar guardas de negocio del paseo (checklist bloqueante, validación de hora) en la máquina de estados: solo legalidad de transición. Las guardas viven en 4.x.
- NO computar Pascua/feriados móviles algorítmicamente: tabla por año.
- NO escribir en `event_log` aquí (no hay mutaciones de negocio; las tablas/migraciones no son eventos de dominio).

### Dependencias externas / acción de Nelson

- En **prod (Railway)**, configurar las vars de R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`) para que la subida de fotos funcione cuando llegue 4.x. En **dev** no son necesarias: `storage.ts` degrada con no-op. (Se suma a los pendientes ya anotados: `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.)
- La migración `0003` debe aplicarse a Neon (`npm run db:migrate`) antes de que las stories 3.x/4.x usen `paseos`.

### Testing standards

- Vitest unit, node env, co-ubicado (`*.test.ts`). [Source: vitest.config.ts]
- Mockear las libs externas en `storage.test.ts` (`@aws-sdk/client-s3`) y `comprimir-imagen.test.ts` (`browser-image-compression`); `fechas.test.ts` y `paseo-estados.test.ts` corren sin mocks (lógica pura / ICU nativo).
- CI verde: `npm run lint && npm run test && npm run build`. Sin E2E en esta story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — ACs fuente (storage, fechas, máquina de estados, tabla paseos + unique)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture, #Resoluciones de brechas, #Architectural Boundaries, #Addendum post-code-review Story 1.1] — snapshot económico, TZ, unique materialización, driver neon-serverless transaccional
- [Source: labradog-app/project-context.md#5,#6,#7,#9,#10,#12,#Contratos diferidos] — dinero entero CLP, fechas UTC/Santiago, lock optimista, snapshot, frontera de servicios externos, contratos diferidos
- [Source: labradog-app/src/lib/db/schema.ts] — `columnasAuditoria`, `columnaVersion`, patrón `pgTable`, tablas existentes
- [Source: labradog-app/src/lib/email.ts] — patrón no-op sin credenciales (espejo para storage.ts)
- [Source: labradog-app/src/lib/db/eventos.test.ts; vitest.config.ts] — patrón de tests Vitest con mocks
- [Source: labradog-app/drizzle.config.ts; drizzle/0000-0002] — flujo de migraciones drizzle-kit
- [Source: _bmad-output/implementation-artifacts/1-3-gestion-de-cuentas-del-equipo.md] — aprendizajes de la story previa (transacciones atómicas, Neon free-tier, ErrorNegocio en capa action)
- [Source: research jun-2026 — 24horas.cl/meteored.cl (DST Chile 2026), npmjs.com/@date-fns/tz, npmjs.com/browser-image-compression] — fechas de cambio de hora y APIs de librerías

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- **Mocks de constructores S3 con `new`.** El primer `storage.test.ts` mockeaba `S3Client`/`PutObjectCommand` con arrow functions (`vi.fn(() => ({...}))`); como `storage.ts` los invoca con `new`, fallaban con "is not a constructor" (las arrow no son construibles). Solución: usar funciones normales (`vi.fn(function () { return {...} })`) que sí funcionan como constructor y devuelven el objeto.

### Completion Notes List

- **Fundaciones puras y testeadas, sin UI (story fundacional).** 22 tests nuevos (49 totales), todos verdes; lint y build (typecheck Next 16) limpios.
- **`lib/fechas.ts` DST-safe verificado con datos reales 2026.** Tests confirman verano UTC−3 / invierno UTC−4 y ambos bordes de cambio (fin verano 4-abr, inicio 5-sep) usando `TZDate` de `@date-fns/tz` (ICU nativo de Node 22). Feriados CL 2026-2027 en tabla por año (deuda técnica anotada: extender anualmente).
- **`lib/engine/paseo-estados.ts` puro.** La tupla `ESTADOS_PASEO` es fuente única y alimenta el `pgEnum('estado_paseo', ...)` del schema (sin desincronización). Test recorre el producto cartesiano completo rechazando toda transición inválida.
- **`lib/storage.ts` = única frontera con R2** (`@aws-sdk/client-s3`), con reintento ante red/5xx (no en 4xx) y no-op sin credenciales (patrón `email.ts`). Compresión en cliente separada en `lib/comprimir-imagen.ts` (WebP, ≤1600px, ≤400KB).
- **Tabla `paseos` creada y migrada a Neon** (migración `0003_ambiguous_wasp.sql`): PK uuid (`gen_random_uuid()` — convención nueva para tablas de negocio), `estado` (pgEnum), snapshots económicos nullable, `version`, auditoría y unique `(recurrencia_id, fecha_local)`. Tabla mínima a propósito: las FKs (recurrencias/perros/tutores/paseadores) llegan por ALTER en sus stories.
- **4 deps nuevas registradas en `architecture.md`** (addendum Story 1.4): `@date-fns/tz`+`date-fns`, `browser-image-compression`, `@aws-sdk/client-s3`. APIs verificadas contra los `.d.ts` instalados antes de codear.

#### Acción requerida de Nelson
- En **prod (Railway)**: configurar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` para que la subida de fotos funcione cuando llegue Epic 4. En dev no son necesarias (storage degrada no-op).
- La migración `0003` ya fue aplicada a Neon (`db:migrate`).

### File List

- labradog-app/src/lib/engine/paseo-estados.ts (nuevo — máquina de estados pura)
- labradog-app/src/lib/engine/paseo-estados.test.ts (nuevo)
- labradog-app/src/lib/fechas.ts (nuevo — TZ Santiago DST-safe + feriados CL)
- labradog-app/src/lib/fechas.test.ts (nuevo)
- labradog-app/src/lib/comprimir-imagen.ts (nuevo — compresión cliente)
- labradog-app/src/lib/comprimir-imagen.test.ts (nuevo)
- labradog-app/src/lib/storage.ts (nuevo — frontera R2 con reintento + no-op)
- labradog-app/src/lib/storage.test.ts (nuevo)
- labradog-app/src/lib/db/schema.ts (modificado — estadoPaseoEnum + tabla paseos)
- labradog-app/drizzle/0003_ambiguous_wasp.sql (nuevo — migración generada)
- labradog-app/drizzle/meta/0003_snapshot.json · _journal.json (generados por drizzle-kit)
- labradog-app/.env.example (modificado — R2_PUBLIC_URL)
- labradog-app/package.json · package-lock.json (modificado — 4 deps nuevas)
- _bmad-output/planning-artifacts/architecture.md (modificado — addendum Story 1.4: deps + convención PK uuid)

## Change Log

- 2026-06-09: Story 1.4 (fundaciones transversales) creada con context engine BMAD. Status → ready-for-dev.
- 2026-06-09: Implementación de Story 1.4: `lib/storage.ts` (R2 + reintento), `lib/comprimir-imagen.ts`, `lib/fechas.ts` (TZ Santiago DST-safe + feriados), `lib/engine/paseo-estados.ts` (máquina de estados pura) y tabla `paseos` (migración 0003, snapshot económico + unique recurrencia/fecha). 22 tests nuevos. lint+test+build verdes. Status → review.
- 2026-06-09: Code review (alto recall) — 2 hallazgos reales corregidos: `urlPublica` normaliza barras (evita `host//key` con `R2_PUBLIC_URL` con trailing slash) y `aInstanteUtc` rechaza formatos fuera de `YYYY-MM-DD`/`HH:mm` (antes truncaba en silencio). +2 tests (51 totales). El resto de hallazgos eran por diseño o responsabilidad de 3.2/4.x/5.x (documentados).
