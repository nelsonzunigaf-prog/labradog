# project-context.md — Guardarraíl para agentes IA

Reglas operativas de `labradog-app`. **Leer ANTES de tocar código.** Las decisiones de fondo viven en `_bmad-output/planning-artifacts/architecture.md` (raíz del repo); ante conflicto, este archivo manda en el día a día y architecture.md en lo estructural.

## Qué es esto

Plataforma interna de Labradog (paseo profesional de perros, Chile): fichas, capacitación de paseadores, agenda de paseos, registro en calle, cobros y liquidaciones. Dos roles: `admin` y `paseador`. UI 100% español de Chile. Paseador opera desde el celular.

## Stack (no cambiar sin registrar en architecture.md)

Next.js 16 App Router + TypeScript estricto + Tailwind 4 + shadcn/ui · Drizzle ORM + Neon Postgres (driver `neon-serverless` WebSocket — soporta transacciones; NO usar `neon-http`) · Better Auth · Cloudflare R2 (fotos) · Resend (email) · Railway (deploy) · Sentry (errores) · Vitest (unit) + Playwright (E2E).

⚠️ **Next.js 16 ≠ tu conocimiento de entrenamiento.** Leer `node_modules/next/dist/docs/` ante cualquier duda (ej: `middleware.ts` ahora se llama `proxy.ts`).

## Reglas duras (sin excepciones)

1. **Idioma del dominio:** sustantivos SIEMPRE en español sin tildes (`paseos`, `recurrencias`, `liquidaciones`); estructura técnica en inglés (`get`, `create`, `Card`). ✅ `getPaseosByPaseador()` · ❌ `getWalks()`
2. **Frontera de capas:** UI → Actions → Engine → DB. La UI jamás toca la BD. Los motores (`src/lib/engine/`) son **funciones puras sin I/O**. Solo `src/lib/db/queries/` ejecuta SQL.
3. **Reglas de negocio viven en el motor** — nunca en la Action ni el componente. La Action orquesta; la UI refleja.
4. **Toda Server Action se crea con `crearAction()`** (`src/lib/action-wrapper.ts`): valida Zod → verifica rol → ejecuta handler → retorna `{ok: true, data} | {ok: false, error}`. Nunca throw hacia la UI.
5. **Dinero: enteros CLP** (`precio_clp: 10000`). Jamás floats ni decimales.
6. **Fechas: UTC en BD** (timestamptz); render y cálculo de recurrencia en `America/Santiago` (utilidad central `lib/fechas.ts`, llega en Story 1.4).
7. **Auditoría:** toda tabla de negocio compone `...columnasAuditoria` (schema.ts). Operaciones sensibles (pagos, evaluaciones, overrides, cancelaciones cobrables, cuentas) escriben además en `event_log` vía `registrarEvento()` (`src/lib/db/eventos.ts`) — única vía permitida; extender su `CatalogoEventos` al agregar eventos. **Negocio + auditoría se escriben en la MISMA `db.transaction(...)`** (atómico: o ambas o ninguna). `event_log` es inmutable también en BD (trigger rechaza UPDATE/DELETE). El tipo de actor vive SOLO en `src/lib/actor.ts`: `ActorSesion` (admin|paseador) para sesiones, `ActorEvento` (+'sistema') para auditoría de procesos automáticos.
8. **Soft-delete vía estado** (`activo`/`inactivo`...) — NUNCA `DELETE` físico de datos de negocio.
9. **Lock optimista:** entidades editables por multi-admin componen `...columnaVersion`; al guardar sobre `version` obsoleta → error "este registro cambió, recarga".
10. **Snapshot económico:** la tabla `paseos` (llega en 1.4) congela `precio_clp_snapshot` al materializar y `comision_pct_snapshot` al completar. Cobros y liquidaciones **leen snapshots, jamás recalculan** de tarifas vigentes.
11. **Validación Zod compartida** en `src/lib/validations/`; el servidor siempre valida (nunca confiar en la UI).
12. **Servicios externos aislados:** R2 solo en `lib/storage.ts`, email solo en `lib/email.ts`. Ningún otro archivo los importa directo.

## Naming

| Ámbito | Regla | Ejemplo |
|---|---|---|
| Tablas | snake_case plural español | `paseos`, `evaluaciones` |
| Columnas | snake_case; FK `<entidad>_id` | `tutor_id`, `estado_emocional` |
| Componentes | PascalCase | `ChecklistPrePaseo.tsx` |
| Server Actions | verbo+dominio camelCase | `completarPaseo()` |
| Rutas | kebab-case español | `/paseador/mi-agenda` |

## Estructura

```
src/app/          (auth)/login · admin/* · paseador/*   ← rutas por rol
src/components/   ui/ (shadcn, NO editar a mano) · <feature>/
src/actions/      server actions por feature
src/lib/engine/   motores puros + tests co-ubicados (*.test.ts)
src/lib/db/       schema.ts (ÚNICO archivo de schema) · queries/ · eventos.ts
src/lib/validations/  Zod por feature
e2e/              Playwright
```

## Proceso de mutación estándar

`validar Zod → verificar rol → ejecutar motor → escribir BD + auditoría → revalidatePath` — todo dentro de `crearAction()`.

## UX y diseño visual (contratos obligatorios)

**Los contratos de UX viven en `_bmad-output/planning-artifacts/ux-designs/ux-labradog-2026-06-12/`** — `DESIGN.md` (identidad "Menta & Mar": tokens shadcn, tipografía, formas, componentes) y `EXPERIENCE.md` (app shell, navegación, estados, accesibilidad, flujos). Toda UI nueva o modificada los cumple; ante conflicto con cualquier mock o costumbre, los contratos mandan.

Reglas mínimas (el detalle está en los contratos): botón "← volver" en toda pantalla no-raíz (misma posición), bottom-nav del paseador, tokens de DESIGN.md (jamás colores ad-hoc), contraste AA (texto blanco sobre menta #5FBFA8 FALLA — usar tinta #1F3833), interacciones de un toque, zonas táctiles ≥48px, teclado solo si el usuario lo invoca, notas críticas del perro sin scroll, direcciones con tap a Maps, feedback de sincronización siempre visible, estados vacío/carga/error con microcopy es-CL.

## Contratos diferidos (los define su story — no improvisar antes)

- **Selección aleatoria con seed persistida** (tests/examen): lo define Story 2.3
- **Barajado de alternativas del examen**: lo define Story 2.5 con el PRNG sembrado — OBLIGATORIO: las `correcta` del banco están sesgadas a la posición 2 (89/100, herencia del Word); presentar en orden almacenado regala el examen (decisión code review 2.1: datos canónicos intactos, se baraja al presentar)
- **Máquina de estados del paseo** (`lib/engine/paseo-estados.ts`): Story 1.4 — estados `pendiente → checklist_completa → en_curso → completado | cancelado`
- **Cola offline** (`lib/offline-queue.ts`): Story 4.2 — eventos con timestamp de origen del dispositivo
- **Materialización idempotente**: Story 3.2 — unique `(recurrencia_id, fecha_local)`, horizonte 14 días

## Enforcement — todo agente IA DEBE

1. Leer este archivo antes de tocar código.
2. Correr `npm run lint && npm run test` antes de dar por cerrada una tarea (debe quedar verde).
3. NO agregar dependencias sin registrar la decisión en `architecture.md`.
4. Nuevas tablas siguen el patrón de auditoría sin excepción.
5. Tests co-ubicados para todo motor; E2E para flujos críticos.
