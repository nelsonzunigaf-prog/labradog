---
baseline_commit: 829c0e0
---

# Story 2.2: Navegación de etapas con desbloqueo secuencial

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paseador,
I want estudiar el contenido de mi etapa actual desde el celular y ver mi avance,
so that me capacito a mi ritmo sin saltarme la secuencia del método.

## Acceptance Criteria

1. **Given** un paseador en capacitación, **When** entro a "Mi capacitación", **Then** veo las etapas con estado (aprobada / actual / bloqueada) y solo puedo abrir contenido hasta mi etapa actual; el módulo de razas se desbloquea al aprobar la etapa 9 (FR-011) — con la convención de 2.1 (razas = numero 10) la regla es uniforme: N se abre al aprobar N-1.
2. **And** la regla de desbloqueo vive en `lib/engine/certificacion.ts` (NUNCA en la Action/query ni el componente) — **esta story define el patrón Engine para todas las reglas posteriores**, con test que verifica que la capa de servidor delega al motor (spy sobre el motor: si alguien reimplementa la regla en la query, el test falla).
3. **And** la lectura es cómoda en móvil (NFR-02): tipografía legible, lista de etapas con zonas táctiles ≥48px, contenido markdown renderizado con jerarquía visual (no texto plano).
4. **And** veo mi avance (etapas aprobadas / 10) en la vista "Mi capacitación".
5. **And** intentar abrir por URL directa una etapa bloqueada NO muestra el contenido: muestra mensaje claro "Aprueba la etapa anterior para desbloquear esta".
6. **And** regresión verde: `npm run lint && npm run test && npm run build` + suite E2E completa; migraciones 0000-0007 intactas (la nueva es 0008); única dependencia nueva permitida: `react-markdown` (registrada en architecture.md).

## Tasks / Subtasks

- [ ] Task 1: Motor `lib/engine/certificacion.ts` — EL PATRÓN ENGINE (AC: 1, 2)
  - [ ] Crear `src/lib/engine/certificacion.ts` (funciones PURAS sin I/O, regla #2). Cabecera que lo declare: "Motor de reglas de capacitación/certificación — patrón Engine del Epic 2 (Story 2.2). Las stories 2.3 (scoring), 2.5 (examen) y 2.6 (gate) EXTIENDEN este archivo."
  - [ ] `export type EstadoEtapa = 'aprobada' | 'actual' | 'bloqueada';`
  - [ ] `calcularEstadosEtapas(numeros: number[], aprobados: ReadonlySet<number>): Array<{ numero: number; estado: EstadoEtapa }>` — ordena por numero; cada numero aprobado → 'aprobada'; la PRIMERA no aprobada (en orden) → 'actual'; el resto → 'bloqueada'. Con huecos (p.ej. aprobadas {1,3}): la 2 es 'actual', la 3 se muestra 'aprobada', 4+ 'bloqueada' — comportamiento explícito y testeado, no accidental.
  - [ ] `puedeAbrirEtapa(numero: number, aprobados: ReadonlySet<number>): boolean` — true si su estado es 'aprobada' o 'actual' (derivar DE calcularEstadosEtapas o de la misma regla, sin duplicar lógica).
  - [ ] `calcularAvance(aprobados: ReadonlySet<number>, totalEtapas: number): { aprobadas: number; total: number }`.
  - [ ] Tests co-ubicados `certificacion.test.ts` (exhaustivos — este motor es el corazón del epic): sin aprobaciones → 1 actual y 2-10 bloqueadas; {1,2,3} → 4 actual; {1..8} → 9 actual y 10 bloqueada; **{1..9} → 10 (módulo razas) actual — ES el test de FR-011**; {1..10} → todas aprobadas, ninguna actual; huecos {1,3}; set vacío de numeros; numeros desordenados en el input.

- [ ] Task 2: Schema — tabla `aprobaciones_etapa` + migración 0008 (AC: 1)
  - [ ] En `src/lib/db/schema.ts` (después de las tablas de contenido de 2.1): tabla `aprobaciones_etapa` — el registro de "el paseador X aprobó la etapa Y". MÍNIMA a propósito (precedente `paseos` 1.4: no inventar columnas especulativas — 2.3/2.4/2.5 agregan lo suyo por ALTER si lo necesitan): `id uuid pk defaultRandom`; `paseadorId: uuid('paseador_id').notNull().references(() => paseadores.id, { onDelete: 'restrict' })` (la capacitación pertenece a la FICHA — 2.6 certifica la ficha); `etapaId: uuid('etapa_id').notNull().references(() => etapas.id, { onDelete: 'restrict' })`; `...columnasAuditoria` (created_by = 'sistema' cuando aprueba un test autocorregido en 2.3, o el admin id en 2.4); unique `('aprobaciones_etapa_paseador_etapa_uq').on(paseadorId, etapaId)`.
  - [ ] Comentario en el schema: quién escribe aquí (2.3 test aprobado, 2.4 veredicto práctico, 2.5 examen) — esta story solo LEE.
  - [ ] `npm run db:generate` → `drizzle/0008_*.sql`; revisar SQL; `npm run db:migrate` a Neon.

- [ ] Task 3: Queries `lib/db/queries/capacitacion.ts` (AC: 1, 2, 4, 5)
  - [ ] ÚNICO lugar con SQL de capacitación (lectura). Tipos exportados.
    - `obtenerCapacitacionParaUsuario(userId)`: resuelve la ficha (`paseadores` por `user_id`); si no hay ficha → `null` (la page muestra "Tu ficha aún no está creada — contacta al administrador"). Trae `etapas` (numero, slug, titulo, modulo, duracion, tipoEvaluacion, esModuloRazas — SIN contenido_md, la lista no lo necesita) + numeros aprobados de `aprobaciones_etapa` → **llama al motor** (`calcularEstadosEtapas`, `calcularAvance`) → retorna `{ etapas: [{...etapa, estado}], avance }`.
    - `obtenerEtapaParaUsuario(userId, slug)`: etapa por slug + aprobados del paseador → **llama `puedeAbrirEtapa`** → si puede: `{ etapa con contenido_md y pauta NO incluida, estado }`; si NO puede: `{ bloqueada: true, titulo, numero }` **sin `contenido_md`** (el contenido jamás viaja al cliente si está bloqueado — el gate es de servidor, AC5). Sin ficha o slug inexistente → `null`.
  - [ ] Test de delegación `capacitacion.test.ts` co-ubicado (AC2): `vi.mock('../index')` (módulo db) con un stub mínimo del chain de drizzle + `vi.spyOn` sobre el motor — verifica que `obtenerEtapaParaUsuario` consulta `puedeAbrirEtapa` con (numero, aprobados) y que con el spy forzado a `false` la respuesta NO incluye `contenido_md`. Si mockear el chain de drizzle resulta frágil, alternativa aceptada: extraer la composición a una función pura exportada `componerEtapaVisible(etapa, aprobados)` en el MOTOR y testear que la query la usa (spy) — la regla nunca duplicada fuera del motor.

- [ ] Task 4: UI móvil primero (AC: 1, 3, 4, 5)
  - [ ] **Dependencia nueva: `react-markdown`** (renderiza el `contenido_md` como árbol React — sin `dangerouslySetInnerHTML`, funciona en Server Components). `npm install react-markdown`. **Registrar la decisión en `_bmad-output/planning-artifacts/architecture.md`** (sección de stack/decisiones): motivo — contenido markdown curado de 2.1 necesita render con jerarquía visual; alternativas descartadas: parser propio (reinventar), `marked` (+`dangerouslySetInnerHTML`, smell de seguridad).
  - [ ] `src/app/paseador/mi-capacitacion/page.tsx` (Server Component): `obtenerCapacitacionParaUsuario(userId de la sesión)`. Header "Mi capacitación" + avance ("X de 10 etapas") con barra de progreso simple (div + width %, sin libs). Lista de etapas como Cards/filas táctiles (≥48px, móvil primero): numero o "Módulo razas" (es_modulo_razas), titulo, duracion, y estado visual — ✅ aprobada (link), ▶ actual (link, destacada), 🔒 bloqueada (sin link, atenuada). Sin ficha → mensaje claro.
  - [ ] `src/app/paseador/mi-capacitacion/[slug]/page.tsx` (Server Component): `obtenerEtapaParaUsuario`. `null` → `notFound()`. `bloqueada` → mensaje "Aprueba la etapa anterior para desbloquear esta" + link de vuelta (AC5). Visible → título + `<ReactMarkdown>` del `contenido_md` con estilos Tailwind legibles en móvil (headings con jerarquía, listas con aire, tablas con scroll horizontal `overflow-x-auto`, blockquotes destacados — clases manuales vía `components={...}` de react-markdown o un wrapper con selectores; SIN plugin typography). Link "← Mi capacitación".
  - [ ] Enlace "Mi capacitación →" en `src/app/paseador/page.tsx` (placeholder "Mi día" de 1.2 — agregar la navegación SIN romper lo existente).
  - [ ] NO mostrar `pauta_md` al paseador (es la guía del evaluador, 2.4). NO botones de "rendir test" (2.3).

- [ ] Task 5: E2E `e2e/capacitacion.spec.ts` (AC: 1, 4, 5)
  - [ ] Patrón establecido: desktop... NO — esta es vista de paseador: usar el proyecto `mobile-chrome` ya configurado, serial, un login con `paseador.test@labradog.cl`. Preparación de datos vía SQL directo (patrón global-setup): crear ficha de paseador para `paseador.test` si no existe (INSERT a `paseadores`) — NO depender de `paseadores.spec.ts` (corre después alfabéticamente y la limpieza de global-setup borra fichas cada corrida).
  - [ ] Flujo: login paseador → "Mi capacitación" → ve 10 ítems, etapa 1 "actual" (abrible), etapa 2 y módulo razas bloqueados, avance "0 de 10" → abre etapa 1 → ve título "Fundamentos del rol" y contenido renderizado (un heading del markdown) → navega por URL directa al slug de la etapa 2 → mensaje de bloqueo SIN contenido → (vía SQL) inserta aprobación de etapa 1 → recarga lista → etapa 1 ✅, etapa 2 "actual", avance "1 de 10" → abre etapa 2 OK.
  - [ ] Selectores con ids/`exact: true` (strict mode — aprendizaje 1.6/1.7). Limpieza: borrar `aprobaciones_etapa` del paseador test al inicio del spec (la ficha cae por cascade del global-setup; las aprobaciones tienen FK restrict a paseadores → verificar orden de limpieza: borrar aprobaciones ANTES de que global-setup borre users/fichas… ATENCIÓN: global-setup borra `user` → cascade `paseadores` → pero `aprobaciones_etapa.paseador_id` es RESTRICT → **el delete de global-setup ROMPERÍA**. SOLUCIÓN obligatoria: agregar `DELETE FROM aprobaciones_etapa` en `e2e/global-setup.ts` ANTES del delete de users (patrón ya previsto en 1.7: "si el run falla por restos, agregar DELETE defensivo").
  - [ ] Smoke de regresión: los specs existentes siguen verdes.

- [ ] Task 6: Regresión final (AC: 6)
  - [ ] `npm run lint && npm run test && npm run build` verdes (111+ unit + los nuevos del motor/queries).
  - [ ] Suite E2E completa verde (13 existentes + capacitacion.spec).
  - [ ] Verificar `package.json`: SOLO `react-markdown` agregada; architecture.md actualizado con la decisión.

## Dev Notes

### Contexto y alcance

Primera story de cara al paseador del Epic 2 y la que **define el patrón Engine** que 2.3/2.5/2.6 extienden: reglas de negocio como funciones puras en `lib/engine/certificacion.ts`, testeadas en aislamiento, con la capa de servidor (queries/actions) delegando SIEMPRE. El contenido ya vive en BD (2.1: tablas `etapas`, `preguntas_etapa`, `preguntas_examen`, seed idempotente). Esta story agrega: el registro de aprobaciones (tabla mínima), el motor de desbloqueo, y la UI móvil de navegación/lectura. [Source: epics.md#Story 2.2; prd.md#FR-010/011, #NFR-02]

### Decisiones de diseño clave (leer antes de implementar)

- **Regla de desbloqueo uniforme gracias a 2.1**: el módulo razas es `numero` 10 en `etapas` → "N se abre al aprobar N-1" cubre FR-011 sin caso especial. El motor trabaja con NÚMEROS de etapa (puros), no con uuids — la query traduce.
- **`aprobaciones_etapa` cuelga de `paseadores.id` (la ficha), NO de `user.id`**: la certificación es de la ficha (2.6: "su ficha pasa a certificado"); un paseador sin ficha no está en capacitación (la page lo dice claro). FK restrict (las aprobaciones son historial de negocio — NUNCA cascade aquí; ver impacto en global-setup abajo).
- **El gate de contenido es de SERVIDOR (AC5)**: `obtenerEtapaParaUsuario` decide con el motor ANTES de incluir `contenido_md` en la respuesta. Jamás "ocultar con CSS" ni filtrar en el componente.
- **`react-markdown` es la única dependencia nueva** y DEBE registrarse en architecture.md (regla #3 del enforcement). Render en Server Component (sin client bundle innecesario). Estilos manuales con Tailwind — NO agregar `@tailwindcss/typography` (segunda dependencia innecesaria).
- **Sin mutaciones en esta story**: no hay Server Actions nuevas (rendir tests = 2.3; veredictos = 2.4). El "test de delegación" del AC2 aplica a la capa que orquesta (queries) — ver Task 3 con la alternativa aceptada si el mock del chain de drizzle resulta frágil.
- **⚠️ global-setup E2E**: la FK restrict de `aprobaciones_etapa` ROMPE el `DELETE FROM "user"` del global-setup (cascade a `paseadores` choca con restrict). Agregar `DELETE FROM aprobaciones_etapa` antes — es el "delete defensivo" que 1.7 dejó previsto.
- **El avance es derivado** (count de aprobaciones / 10) — NO columna `etapa_actual` en ninguna tabla: una sola fuente de verdad (las aprobaciones), el motor deriva el resto.

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/schema.ts` — agregar `aprobacionesEtapa` al final (después de `preguntasExamen` de 2.1).
- `src/app/paseador/page.tsx` — placeholder "Mi día" de 1.2 (28 líneas: header + CerrarSesion). Agregar el link a Mi capacitación sin romper el header existente.
- `e2e/global-setup.ts` — agregar el DELETE de `aprobaciones_etapa` ANTES del delete de users. Leer el archivo para insertar en el orden correcto.
- `_bmad-output/planning-artifacts/architecture.md` — registrar `react-markdown` (y de paso la variación `.mjs` de 2.1 si aún no está, como sugirió el review).
- `package.json` — `react-markdown` en dependencies.

### Patrones existentes a reutilizar (NO reinventar)

- **Motor puro + tests**: `lib/engine/paseo-estados.ts` y `fichas.ts` (estructura, comentarios de cabecera, tests co-ubicados). **Queries**: `lib/db/queries/paseadores.ts` (tipos exportados, JSDoc, regla #2). **Página de detalle por param**: `app/admin/paseadores/[userId]/page.tsx` (notFound, Server Component). **Sesión en page**: `app/paseador/page.tsx` (`auth.api.getSession`). **Cards/Badge/Table**: shadcn ya instalado (`components/ui/`). **E2E móvil + SQL directo**: `e2e/global-setup.ts` (conexión SQL), `e2e/paseadores.spec.ts` (selectores con ids/exact, serial).
- **Slug de etapa**: ya existe en `etapas.slug` (unique, sembrado por 2.1: `fundamentos-del-rol`, etc.) — la ruta es `/paseador/mi-capacitacion/[slug]`, NO inventar otro identificador en URL.

### Qué NO hacer (límites de alcance)

- NO rendir tests ni mostrar preguntas (2.3 — ni siquiera botón deshabilitado con promesas).
- NO registrar veredictos prácticos ni mostrar `pauta_md` al paseador (2.4 — la pauta es del evaluador).
- NO examen final (2.5), NO certificación/gate (2.6), NO tablero admin (2.7).
- NO crear `intentos_test` ni columnas de scoring — solo `aprobaciones_etapa` mínima.
- NO escribir en `aprobaciones_etapa` desde la app (solo el E2E siembra vía SQL para probar estados).
- NO `@tailwindcss/typography` ni ninguna dependencia más allá de `react-markdown`.

### Dependencias externas / acción de Nelson

- Ninguna config nueva. Migración `0008` + `npm install` (lockfile cambia). Al cutover de prod: nada extra (la tabla nace vacía).

### Testing standards

- Vitest co-ubicado (motor exhaustivo — es EL patrón del epic); test de delegación en queries (AC2). E2E móvil (`mobile-chrome`) serial con un login y datos sembrados por SQL. CI: lint+test+build.

### Project Structure Notes

- Rutas: `/paseador/mi-capacitacion` y `/paseador/mi-capacitacion/[slug]` (kebab-case español — regla de naming). Motor en `src/lib/engine/certificacion.ts` (nombre fijado por el epic). Queries en `src/lib/db/queries/capacitacion.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — ACs fuente; #Story 2.3/2.4/2.6 — quién escribe aprobaciones después
- [Source: _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md#FR-010/FR-011, #NFR-02] — desbloqueo secuencial, móvil primero
- [Source: _bmad-output/implementation-artifacts/2-1-seed-del-contenido-de-capacitacion.md#Dev Agent Record] — convención numero 10 = razas, tablas de contenido, gotcha BOM de PowerShell
- [Source: labradog-app/project-context.md] — reglas #2 (motores puros), #3 (reglas en motor), #7 (auditoría), UX paseador (≥48px), contratos diferidos (scoring = 2.3, barajado = 2.5)
- [Source: labradog-app/src/lib/engine/paseo-estados.ts; lib/db/queries/paseadores.ts; e2e/global-setup.ts] — patrones exactos a imitar

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-12: Story 2.2 (navegación de etapas con desbloqueo secuencial) creada con context engine BMAD. Define el patrón Engine del Epic 2. Status → ready-for-dev.
