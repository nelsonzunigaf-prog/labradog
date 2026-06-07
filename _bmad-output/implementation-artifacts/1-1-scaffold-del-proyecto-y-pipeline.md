---
baseline_commit: NO_VCS
---

# Story 1.1: Scaffold del proyecto y pipeline

Status: in-progress

## Story

As a admin (Nelson),
I want el proyecto inicializado con el stack decidido, desplegado y con CI funcionando,
so that toda story posterior se construye sobre una base estable, auditable y desplegable.

## Acceptance Criteria

1. **Given** la arquitectura aprobada, **When** se ejecuta el scaffold (`create-next-app` + Drizzle + Better Auth + shadcn/ui), **Then** la app corre local y desplegada en Railway con healthcheck OK
2. **And** GitHub Actions corre lint + tests en cada PR; Sentry conectado
3. **And** existen `project-context.md` (convenciones para agentes IA) y el **wrapper estándar de Server Action** (validación Zod + verificación de rol + resultado tipado `{ok, data | error}`) que toda action posterior usará
4. **And** el patrón de auditoría queda implementado: helper de columnas `*_by/*_at` + tabla `event_log` con **writer tipado** (`registrarEvento(tipo, entidad, payload, actor)`) y tests
5. **And** las decisiones de esquema transversales quedan documentadas en `project-context.md`: columnas de snapshot económico en `paseos`, columna `version` en entidades editables, soft-delete vía estado (no DELETE físico)

## Tasks / Subtasks

- [x] Task 1: Scaffold base (AC: 1)
  - [x] `git init` en `C:\Users\nelso\source\repos\labradog` (la carpeta NO es repo git aún) con `.gitignore` raíz que excluya `archivos del proyecto/` y `{output_folder}/` si corresponde
  - [x] `npx create-next-app@latest labradog-app --yes` (Next.js 16.2.7, TS, Tailwind, ESLint, App Router, `src/`, alias `@/*`, Turbopack)
  - [x] `npx shadcn@latest init` dentro de `labradog-app` (componentes copiados al repo en `src/components/ui/`; preset base-nova con @base-ui/react)
  - [x] Dependencias: `npm install drizzle-orm @neondatabase/serverless better-auth zod` · dev: `npm install -D drizzle-kit vitest @vitejs/plugin-react @playwright/test dotenv`
  - [x] Crear estructura de carpetas vacías con `.gitkeep` o archivos iniciales según árbol de arquitectura: `src/lib/engine/`, `src/lib/db/queries/`, `src/lib/validations/`, `src/actions/`, `e2e/`, `scripts/`, `drizzle/`
- [x] Task 2: Drizzle + Neon configurados (AC: 1, 4)
  - [x] `drizzle.config.ts` (dialect postgresql, schema `src/lib/db/schema.ts`, out `./drizzle`, url desde `DATABASE_URL`)
  - [x] `src/lib/db/index.ts` con driver `drizzle-orm/neon-http`
  - [x] `.env.example` con `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `R2_*` (placeholder, se usa en 1.4), `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`, `RESEND_API_KEY` (placeholder, se usa en 1.2)
  - [x] Scripts npm: `db:generate` (drizzle-kit generate), `db:migrate` (drizzle-kit migrate)
- [ ] Task 3: Patrón de auditoría (AC: 4)
  - [x] Helper de columnas de auditoría en `src/lib/db/schema.ts`: `columnasAuditoria` (+ `columnaVersion` para lock optimista) para componer en toda tabla
  - [x] Tabla `event_log` en schema: `id`, `tipo`, `entidad`, `entidad_id`, `payload` (jsonb), `actor_id`, `created_at` — inmutable (solo INSERT)
  - [x] Writer tipado `registrarEvento(tipo, entidad, payload, actor)` en `src/lib/db/eventos.ts` (CatalogoEventos: tipos TS estrictos por tipo de evento)
  - [x] Tests Vitest del writer (inserta fila correcta; payload serializado; rechaza tipo desconocido a nivel de tipos) — 3 tests ✅
  - [ ] Migración inicial generada ✅ (`drizzle/0000_auditoria-event-log.sql`) y aplicada a Neon ⏳ **PENDIENTE: requiere DATABASE_URL de Nelson (BD en limpieza)**
- [x] Task 4: Wrapper estándar de Server Action (AC: 3)
  - [x] `src/lib/action-wrapper.ts`: `crearAction({schema, roles, handler})`; retorna `{ ok: true, data } | { ok: false, error: string }`; nunca lanza hacia la UI
  - [x] Chequeo de rol como interfaz inyectable: `src/lib/actor.ts` con `getActor()` stub — Story 1.2 lo conecta a Better Auth sin tocar el wrapper
  - [x] Tests Vitest: input inválido / sin sesión / rol incorrecto / flujo OK / handler lanza / multi-rol — 6 tests ✅
- [x] Task 5: CI + calidad (AC: 2)
  - [x] Vitest configurado (`vitest.config.ts`, tests co-ubicados `*.test.ts`); scripts `test`, `test:watch`, `test:e2e`
  - [x] `.github/workflows/ci.yml` (raíz del repo, `working-directory: labradog-app`): en cada PR y push a main → `npm ci`, `npm run lint`, `npm run test`
  - [x] Playwright configurado (proyecto mobile-chrome — móvil primero NFR-02) con smoke E2E `e2e/healthcheck.spec.ts` — 2 tests ✅
- [ ] Task 6: Deploy Railway + Sentry (AC: 1, 2)
  - [x] Ruta healthcheck `src/app/api/health/route.ts` → `{status, checks}` con chequeo de conexión a BD (200 ok / 503 degradado)
  - [ ] Proyecto Railway conectado al repo GitHub con auto-deploy desde main; healthcheck path configurado ⏳ **PENDIENTE: requiere push a GitHub + cuenta Railway de Nelson (Root Directory: labradog-app, Healthcheck: /api/health)**
  - [ ] `@sentry/nextjs` 10.56 instalado y configurado (instrumentation server/edge/client, activo solo con DSN) ✅; verificar que un error de prueba llega a Sentry ⏳ **PENDIENTE: requiere DSN de Nelson**
- [x] Task 7: `project-context.md` (AC: 3, 5)
  - [x] Creado `labradog-app/project-context.md` con: naming español, estructura, patrón UI → Actions → Engine → DB, contrato de actions, dinero enteros CLP, fechas UTC/Santiago, patrón de auditoría, y decisiones de esquema transversales (snapshot económico, `version`, soft-delete vía estado)
  - [x] Documentados: contratos diferidos (seed 2.3, máquina estados 1.4, cola offline 4.2, materialización 3.2) y reglas de enforcement para agentes IA

## Dev Notes

### Contexto crítico de arquitectura (OBLIGATORIO)

- **Stack pineado (verificado jun-2026):** Next.js 16.2 (App Router, Turbopack), TypeScript estricto, Tailwind, shadcn/ui (copiado, no dependencia), Drizzle 0.45+, Better Auth v1.6+, Neon Postgres (free tier), Cloudflare R2 (fotos — config en 1.4), Railway ($5/mes), Sentry free tier, Resend (email — se usa desde 1.2). [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- **⚠️ Next.js 16 renombró `middleware.ts` → `proxy.ts`** (misma función de intercepción; el árbol de arquitectura dice `src/middleware.ts` pero en Next 16 el archivo es `src/proxy.ts`). Esta story NO implementa auth (eso es 1.2), pero si el scaffold genera referencias, usar el nombre nuevo. [Source: web research jun-2026 — nextjs.org/docs/app/guides/upgrading/version-16]
- **Driver BD:** `drizzle-orm/neon-http` con `@neondatabase/serverless` (recomendado para serverless; Railway es server persistente pero el driver HTTP funciona y simplifica). Migraciones: `drizzle-kit generate` → `drizzle-kit migrate`. [Source: orm.drizzle.team/docs/connect-neon]
- **Idioma del dominio:** sustantivos SIEMPRE en español sin tildes (`paseos`, `event_log` es excepción técnica aceptada, `registrarEvento`), técnica en inglés. Tablas snake_case plural, columnas snake_case, FK `<entidad>_id`, componentes PascalCase, actions camelCase verbo+dominio, rutas kebab-case español. [Source: architecture.md#Implementation Patterns]
- **Frontera dura:** UI → Actions → Engine → DB. Motores en `src/lib/engine/` son funciones puras sin I/O. Solo `src/lib/db/queries/*` ejecuta SQL. `schema.ts` es UN solo archivo (visión completa para IA). [Source: architecture.md#Architectural Boundaries]
- **Dinero:** enteros CLP (`precio_clp: 10000`), jamás floats. **Fechas:** UTC en BD, render America/Santiago. [Source: architecture.md#Format Patterns]
- **Proceso de mutación estándar** (el wrapper de Task 4 lo encarna): validar Zod → verificar rol → ejecutar motor → escribir auditoría → `revalidatePath`. [Source: architecture.md#Process Patterns]

### Qué NO hacer en esta story (límites de alcance)

- NO implementar login ni Better Auth funcional (Story 1.2) — solo instalar la dependencia y dejar `BETTER_AUTH_SECRET` en `.env.example`
- NO crear la tabla `paseos` ni `lib/storage.ts` ni `lib/fechas.ts` ni la máquina de estados (Story 1.4)
- NO crear fichas ni entidades de negocio (Stories 1.5-1.7)
- NO configurar el cron de Railway ni `lib/email.ts` (Stories 1.2 usa email de recuperación; 3.7 el cron)
- El schema de esta story contiene SOLO: `event_log` + helper de auditoría (+ las tablas que Better Auth requiera quedan para 1.2)

### Dependencias externas que requieren acción de Nelson

Estas requieren cuentas/credenciales que el agente no puede crear solo — pedir al usuario en el momento adecuado:

1. **GitHub:** repo remoto para `labradog` (CI y Railway dependen de él)
2. **Neon:** proyecto + `DATABASE_URL`
3. **Railway:** cuenta + proyecto conectado al repo ($5/mes)
4. **Sentry:** proyecto + DSN (free tier)

### Project Structure Notes

- La app vive en `labradog-app/` DENTRO de la carpeta `labradog/` (que también contiene `_bmad-output/`, `docs/`, `archivos del proyecto/`). El repo git se inicializa en la raíz `labradog/`. Railway debe apuntar al subdirectorio `labradog-app/` (root directory setting) — o alternativamente el CI usa `working-directory: labradog-app`
- Árbol objetivo completo en [Source: architecture.md#Complete Project Directory Structure] — crear las carpetas del esqueleto aunque queden vacías, para que las stories siguientes no improvisen ubicaciones
- `AGENTS.md` lo genera create-next-app; `project-context.md` es un entregable separado y manual (guardarraíl IA)

### Testing standards

- Vitest para unit (co-ubicados: `eventos.test.ts` junto a `eventos.ts`); Playwright para E2E en `e2e/`
- Esta story entrega: tests del writer de eventos, tests del wrapper de action, smoke E2E del healthcheck
- CI debe quedar VERDE: `npm run lint && npm run test` pasan localmente antes de cerrar

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — TODAS las decisiones; secciones clave: Starter Template, Core Architectural Decisions, Implementation Patterns, Project Structure
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — ACs fuente
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements] — patrón auditoría, decisiones de esquema adelantadas, convenciones
- Better Auth + Next.js 16: https://better-auth.com/docs/integrations/next · Drizzle + Neon: https://orm.drizzle.team/docs/connect-neon

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- vi.mock hoisting error en eventos.test.ts → resuelto con `vi.hoisted()`
- shadcn CLI cambió flags (`--base-color` ya no existe) → `init -d -y` (preset base-nova, usa @base-ui/react en vez de Radix)
- AGENTS.md generado advierte breaking changes Next 16 → docs locales en `node_modules/next/dist/docs/` verificados para route handlers

### Completion Notes List

- Scaffold completo: Next.js 16.2.7 + React 19.2.4, TS estricto, Tailwind 4, shadcn/ui, src/, alias @/*
- Drizzle 0.45.2 + @neondatabase/serverless 1.1 (driver neon-http); Better Auth 1.6.14 instalado (se configura en 1.2); Zod 4
- Patrón de auditoría: `columnasAuditoria` + `columnaVersion` (helpers componibles) + tabla `event_log` + writer tipado `registrarEvento` con CatalogoEventos extensible — migración `0000_auditoria-event-log.sql` generada
- Wrapper `crearAction()` con `getActor()` inyectable (stub hasta 1.2); contrato `{ok,data|error}` garantizado
- Sentry 10.56 con instrumentación completa (server/edge/client + onRequestError), inactivo sin DSN; sin tracing (solo errores, free tier)
- Validación: lint ✅ · 9 unit tests ✅ · 2 E2E smoke ✅ (mobile-chrome) · build producción ✅
- ⏳ Pendientes que requieren credenciales de Nelson: aplicar migración a Neon (DATABASE_URL), conectar Railway (push GitHub + Root Directory labradog-app + healthcheck /api/health), verificar error de prueba en Sentry (DSN)

### File List

- .gitignore (raíz, nuevo)
- .github/workflows/ci.yml (nuevo)
- scripts/db-reset.sql (nuevo, utilidad para Nelson)
- labradog-app/* (scaffold create-next-app + shadcn: package.json, tsconfig.json, next.config.ts, eslint.config.mjs, postcss.config.mjs, components.json, src/app/*, src/components/ui/button.tsx, src/lib/utils.ts, AGENTS.md, CLAUDE.md)
- labradog-app/drizzle.config.ts (nuevo)
- labradog-app/vitest.config.ts (nuevo)
- labradog-app/playwright.config.ts (nuevo)
- labradog-app/.env.example (nuevo)
- labradog-app/project-context.md (nuevo)
- labradog-app/sentry.server.config.ts (nuevo)
- labradog-app/sentry.edge.config.ts (nuevo)
- labradog-app/src/instrumentation.ts (nuevo)
- labradog-app/src/instrumentation-client.ts (nuevo)
- labradog-app/src/lib/db/schema.ts (nuevo)
- labradog-app/src/lib/db/index.ts (nuevo)
- labradog-app/src/lib/db/eventos.ts (nuevo)
- labradog-app/src/lib/db/eventos.test.ts (nuevo)
- labradog-app/src/lib/actor.ts (nuevo)
- labradog-app/src/lib/action-wrapper.ts (nuevo)
- labradog-app/src/lib/action-wrapper.test.ts (nuevo)
- labradog-app/src/app/api/health/route.ts (nuevo)
- labradog-app/e2e/healthcheck.spec.ts (nuevo)
- labradog-app/drizzle/0000_auditoria-event-log.sql (generado)
- labradog-app/src/lib/engine/.gitkeep · src/lib/db/queries/.gitkeep · src/lib/validations/.gitkeep · src/actions/.gitkeep (esqueleto)
