---
baseline_commit: e9e27eb
---

# Story 1.2: Login con roles

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a miembro del equipo (admin o paseador),
I want iniciar sesión con email y contraseña y llegar a mi área según mi rol,
so that cada uno ve solo lo que le corresponde.

## Acceptance Criteria

1. **Given** una cuenta existente con rol asignado, **When** inicio sesión con credenciales válidas, **Then** llego a `/admin` o `/paseador` según mi rol
2. **And** el proxy (ex-middleware) me impide acceder al área del otro rol y redirige a no autenticados al login
3. **Given** que olvidé mi contraseña, **When** solicito recuperación, **Then** recibo email con enlace de restablecimiento funcional (vía `lib/email.ts` / Resend) y puedo fijar una nueva contraseña
4. **And** no existe auto-registro: ninguna ruta pública permite crear cuentas (FR-002)
5. **And** `getActor()` queda conectado a la sesión real de Better Auth SIN cambiar su firma (el wrapper `crearAction` y sus tests siguen pasando intactos)
6. **And** existe una vía server-side para crear el primer admin (seed/script), ya que no hay registro público

## Tasks / Subtasks

- [ ] Task 1: Tablas de Better Auth en el schema (AC: 1, 4, 6)
  - [ ] Agregar a `src/lib/db/schema.ts` las 4 tablas que Better Auth requiere para email+password: `user`, `session`, `account`, `verification` (nombres por defecto, snake_case en columnas). **Excepción consciente a la regla de naming español**: son tablas del framework de auth, se dejan con nombres por defecto de Better Auth para que el adapter funcione sin fricción (documentar la excepción con un comentario en el schema, igual que `event_log`).
  - [ ] Campo de rol en `user`: columna `rol` tipo text NOT NULL (valores `admin` | `paseador`) — vía `additionalFields` del adapter Y como columna real en la tabla Drizzle. **NO** incluir `'sistema'` aquí: ese rol vive solo en `event_log.actor_rol` (ver `actor.ts`, addendum architecture.md 07-06-2026).
  - [ ] Campo `estado` en `user` (text, default `'activo'`) para soft-delete vía estado — lo consumirá Story 1.3 (activar/desactivar cuentas); en 1.2 solo se crea la columna y el login rechaza usuarios no-activos.
  - [ ] Las tablas de auth NO componen `...columnasAuditoria` (las gestiona Better Auth con sus propios `createdAt/updatedAt`); las mutaciones sobre cuentas se auditan vía `event_log` en Story 1.3, no aquí.
  - [ ] Generar migración con `npm run db:generate` (será `drizzle/0002_*.sql`; 0000 y 0001 ya existen) y aplicarla a Neon con `npm run db:migrate`. Verificar con `node scripts/db-inspect.mjs` que las 4 tablas existen.
- [ ] Task 2: Configuración de Better Auth (AC: 1, 3, 4, 6)
  - [ ] Crear `src/lib/auth.ts` con `betterAuth({...})`:
    - `database: drizzleAdapter(db, { provider: 'pg', schema })` (import desde `better-auth/adapters/drizzle`; pasar el objeto `schema` completo de `./db/schema`)
    - `emailAndPassword: { enabled: true, disableSignUp: true, sendResetPassword: async ({ user, url }) => { ... }, resetPasswordTokenExpiresIn: 3600 }` — `disableSignUp: true` es lo que implementa FR-002 a nivel de API
    - `user: { additionalFields: { rol: { type: 'string', required: true, input: false }, estado: { type: 'string', required: false } } }` — `input: false` impide que el rol se setee desde requests del cliente
    - `plugins: [nextCookies()]` (import desde `better-auth/next-js`) — **debe ir al final del array de plugins** para que gestione cookies en Server Actions
    - `secret: process.env.BETTER_AUTH_SECRET`, `baseURL: process.env.BETTER_AUTH_URL`
  - [ ] Crear `src/lib/auth-client.ts` con `createAuthClient({ baseURL })` (import desde `better-auth/react`) para uso en componentes cliente.
  - [ ] Route handler `src/app/api/auth/[...all]/route.ts`: `export const { GET, POST } = toNextJsHandler(auth)` (import `toNextJsHandler` desde `better-auth/next-js`).
- [ ] Task 3: Conectar `getActor()` a la sesión real (AC: 5)
  - [ ] Reemplazar SOLO el cuerpo de `getActor()` en `src/lib/actor.ts`: llamar `auth.api.getSession({ headers: await headers() })` (import `headers` desde `next/headers`), mapear a `{ id, rol }` o `null`. **No cambiar las firmas ni los tipos exportados** (`Rol`, `ActorSesion`, `ActorEvento`).
  - [ ] Rechazar como no-autenticado a usuarios con `estado !== 'activo'` (devolver `null`) — base para el soft-delete de 1.3.
  - [ ] Confirmar que `action-wrapper.test.ts` (que mockea `getActor`) sigue verde sin modificarse.
- [ ] Task 4: Email de recuperación con Resend (AC: 3)
  - [ ] Crear `src/lib/email.ts` — ÚNICO punto de salida de email (regla #12 de project-context). Función `enviarEmail({ to, subject, html })` que usa Resend (`RESEND_API_KEY`). Si la key no está definida, loguear y no-op (mismo patrón defensivo que Sentry sin DSN), para que dev local no rompa.
  - [ ] Instalar dependencia `resend` (`npm install resend`) y **registrar la decisión en architecture.md** (regla de enforcement #3) si no está ya documentada — el addendum FR-041 ya menciona Resend en `lib/email.ts`, así que basta con confirmar versión.
  - [ ] El callback `sendResetPassword` de Task 2 invoca `enviarEmail` con plantilla en español de Chile, texto simple, con el enlace `url` que provee Better Auth.
- [ ] Task 5: Proxy de rutas por rol (AC: 1, 2)
  - [ ] Crear `src/proxy.ts` (Next.js 16 renombró `middleware.ts` → `proxy.ts`): `export function proxy(request)` + `export const config = { matcher: [...] }`.
  - [ ] Redirect **optimista** basado en presencia de cookie de sesión: sin cookie en `/admin/*` o `/paseador/*` → redirect a `/login`. **NO** leer el rol en el proxy (es solo optimista, no verificación real).
  - [ ] La verificación real de rol vive en los layouts de servidor (Task 6).
- [ ] Task 6: Páginas y layouts (AC: 1, 2, 3, 4)
  - [ ] `src/app/(auth)/login/page.tsx`: formulario email+password (shadcn/ui). Usa `authClient.signIn.email(...)` o una Server Action con `crearAction` envolviendo `auth.api.signInEmail`. Tras login OK, redirigir a `/admin` o `/paseador` según rol. Mostrar errores en español sin filtrar detalles.
  - [ ] `src/app/(auth)/forgot-password/page.tsx`: pide email → `authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })`. Mensaje genérico ("si el email existe, enviamos instrucciones") sin revelar si la cuenta existe.
  - [ ] `src/app/(auth)/reset-password/page.tsx`: lee `token` del query string → form nueva contraseña → `authClient.resetPassword({ newPassword, token })`.
  - [ ] `src/app/admin/layout.tsx`: verifica sesión real con `getActor()`; si no es `admin` → redirect (`/login` si null, `/paseador` si rol cruzado). `src/app/paseador/layout.tsx`: simétrico para `paseador`.
  - [ ] `src/app/admin/page.tsx` y `src/app/paseador/page.tsx`: placeholders mínimos ("Hola, {nombre}" + botón cerrar sesión) — el contenido real llega en stories posteriores.
  - [ ] Botón/acción de cerrar sesión (`authClient.signOut()` o action) que redirige a `/login`.
  - [ ] **NINGUNA ruta de registro público** — verificar que no exista `sign-up` page ni enlace; `disableSignUp: true` lo bloquea en API.
- [ ] Task 7: Seed del primer admin (AC: 6)
  - [ ] Script `scripts/crear-admin.mjs` (ejecutable con `node`, requiere flag `--confirmar` como `db-reset.mjs`): crea un admin server-side sin pasar por signup público. Usar `auth.api.signUpEmail` internamente (Better Auth permite creación server-side aunque `disableSignUp` bloquee la ruta pública) o `auth.api.createUser` si se habilita el plugin admin; setear `rol: 'admin'`, `estado: 'activo'`. Pedir email/password por args o env, NO hardcodear.
  - [ ] Documentar en el script el uso. Registrar el evento de creación en `event_log` con actor `'sistema'` (`registrarEvento` + `ActorEvento` rol `'sistema'`).
- [ ] Task 8: Tests (AC: 1, 2, 3, 5)
  - [ ] Unit (Vitest): `getActor()` mapea sesión a `{id, rol}` y devuelve null sin sesión / con estado inactivo (mockear `auth.api.getSession`).
  - [ ] Unit: que `action-wrapper.test.ts` siga verde sin cambios (regresión de la firma de `getActor`).
  - [ ] E2E (Playwright, mobile-chrome): login con credenciales válidas de paseador → llega a `/paseador`; intento de paseador a `/admin` → bloqueado; no-autenticado a `/admin` → `/login`. Usar el admin seed o un usuario de prueba creado en setup.
  - [ ] CI debe quedar verde: `npm run lint && npm run test && npm run build`.

## Dev Notes

### Contexto crítico de arquitectura (OBLIGATORIO)

- **⚠️ Next.js 16 ≠ tu conocimiento de entrenamiento.** Leer `node_modules/next/dist/docs/` ante cualquier duda. Confirmado: `middleware.ts` → **`proxy.ts`** (`export function proxy(request)` + `export const config = { matcher }`). [Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md]
- **Better Auth v1.6.14 (versión instalada, verificada en node_modules):** las APIs se confirmaron contra los `.d.mts` instalados, NO contra memoria. [Source: node_modules/better-auth/package.json → "version": "1.6.14"]
- **Driver de BD ya es `neon-serverless` (WebSocket, Pool)** desde el code review de 1.1 — soporta transacciones. El adapter Drizzle de Better Auth funciona con la instancia `db` exportada de `src/lib/db/index.ts`. [Source: architecture.md#Addendum post-code-review Story 1.1]
- **Frontera de capas:** UI → Actions → Engine → DB. El login y reset pueden usar el `authClient` (cliente) o Server Actions envueltas en `crearAction`. La verificación de rol en layouts usa `getActor()`. [Source: project-context.md regla #2, #4]
- **Sin auto-registro (FR-002):** se implementa con `emailAndPassword.disableSignUp: true` + ausencia de cualquier página/enlace de registro. Cuentas las crea el admin (1.3) o el seed (Task 7). [Source: architecture.md#Authentication & Security; epics.md#Story 1.2]

### Hechos verificados de Better Auth 1.6.14 (contra los tipos instalados)

- **Config server:** `betterAuth({ emailAndPassword: { enabled, disableSignUp, sendResetPassword(data, request), resetPasswordTokenExpiresIn (default 3600s), requireEmailVerification, minPasswordLength (8), maxPasswordLength (128), autoSignIn (true), revokeSessionsOnPasswordReset (false) }, ... })`. [Source: node_modules/@better-auth/core/dist/types/init-options.d.mts:532-674]
- **Adapter Drizzle:** `import { drizzleAdapter } from 'better-auth/adapters/drizzle'` → `drizzleAdapter(db, { provider: 'pg', schema, usePlural?, camelCase?, transaction? })`. Renombrar tablas/campos vía `user: { modelName?, fields?, additionalFields? }`. [Source: node_modules/@better-auth/drizzle-adapter/dist/index.d.mts:1-47]
- **Tablas por defecto requeridas:** `user` (id, email, emailVerified, name, image, createdAt, updatedAt), `session` (id, userId, expiresAt, token, ipAddress, userAgent, createdAt, updatedAt), `account` (id, userId, providerId, accountId, password[hash], tokens..., createdAt, updatedAt), `verification` (id, identifier, value, expiresAt, createdAt, updatedAt). [Source: node_modules/@better-auth/core/dist/db/schema/*.d.mts]
- **Next.js:** `import { toNextJsHandler, nextCookies } from 'better-auth/next-js'`. `nextCookies()` debe ir al FINAL del array `plugins`. [Source: node_modules/better-auth/dist/integrations/next-js.d.mts]
- **Sesión server-side:** `auth.api.getSession({ headers })` (headers de `next/headers`). [Source: node_modules/better-auth/dist/api/index.d.mts]
- **Reset de contraseña SÍ existe en 1.6.14** (el reporte inicial de research se equivocó; verificado en los tipos): endpoints `/request-password-reset`, `/reset-password/:token`, `/reset-password`. Cliente: `authClient.requestPasswordReset({ email, redirectTo })` y `authClient.resetPassword({ newPassword, token })`; server: `auth.api.requestPasswordReset(...)`. [Source: node_modules/better-auth/dist/api/routes/password.d.mts:5,42,90,182 y password.mjs:20,83,195]
- **Cliente:** `import { createAuthClient } from 'better-auth/react'` → `authClient.signIn.email({ email, password })`, `authClient.signOut()`, `authClient.getSession()`. [Source: node_modules/better-auth/dist/client/react/index.d.mts]
- **Creación server-side de usuarios:** existe plugin admin (`better-auth/plugins/admin` → `admin.createUser({ email, password, name, role })`), o `auth.api.signUpEmail` server-side. Evaluar cuál es más simple para el seed sin habilitar superficie de más. [Source: node_modules/better-auth/dist/plugins/admin/admin.d.mts:171-200]

### Punto de integración clave dejado por Story 1.1

`src/lib/actor.ts` tiene `getActor()` como **stub que retorna null**, diseñado explícitamente para que 1.2 lo conecte SIN tocar `action-wrapper.ts`. Reemplazar solo el cuerpo, conservar firma `Promise<ActorSesion | null>`. El wrapper y sus 6 tests deben seguir pasando intactos. [Source: src/lib/actor.ts; 1-1-scaffold-del-proyecto-y-pipeline.md Task 4]

### Qué NO hacer en esta story (límites de alcance)

- **NO** implementar la gestión de cuentas (crear/activar/desactivar desde UI admin) — eso es Story 1.3. Aquí solo: columna `estado` + el login que rechaza no-activos + el seed del primer admin.
- **NO** crear `lib/storage.ts`, `lib/fechas.ts`, la máquina de estados ni la tabla `paseos` (Story 1.4).
- **NO** configurar el cron de Railway (Story 3.7). `lib/email.ts` se crea aquí pero solo con la función base + plantilla de reset.
- **NO** crear fichas ni entidades de negocio (1.5-1.7).
- Las tablas de auth son una **excepción consciente** a la regla de naming español (igual que `event_log`): se dejan con nombres por defecto de Better Auth.

### Dependencias externas que requieren acción de Nelson

1. **`BETTER_AUTH_SECRET`**: generar (`npx @better-auth/cli secret` o `openssl rand -base64 32`) y configurar en `.env` local y en Railway. Verificar `BETTER_AUTH_URL` (local `http://localhost:3000`, prod la URL de Railway).
2. **Resend**: cuenta + `RESEND_API_KEY` + dominio verificado (o usar `onboarding@resend.dev` en dev). Configurar en `.env` y Railway.
3. **Primer admin**: tras el deploy, correr `scripts/crear-admin.mjs --confirmar` con las credenciales que Nelson elija.

### Project Structure Notes

- Rutas nuevas siguen el árbol de arquitectura: `src/app/(auth)/login`, `src/app/admin/*`, `src/app/paseador/*`, `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/email.ts`, `src/app/api/auth/[...all]/route.ts`. [Source: architecture.md#Complete Project Directory Structure]
- El árbol de arquitectura nombra `src/middleware.ts` y `src/lib/auth.ts` — usar el nombre nuevo `proxy.ts` por Next 16. [Source: architecture.md líneas 242, 264]
- Migración nueva: `drizzle/0002_*.sql` (0000 = event_log, 0001 = auditoría rol/índices/trigger ya aplicadas).

### Testing standards

- Vitest unit co-ubicado: `actor.test.ts` junto a `actor.ts`. Mockear `auth.api.getSession`.
- Playwright E2E en `e2e/`: flujo de login + protección de rutas por rol (flujo crítico → requiere E2E por NFR). Reusar proyecto mobile-chrome.
- Regresión obligatoria: `action-wrapper.test.ts` verde sin cambios.
- CI verde: `npm run lint && npm run test && npm run build` (el build ya es parte del CI desde 1.1).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — ACs fuente
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — Better Auth, roles, sin auto-registro, middleware por grupo de rutas
- [Source: _bmad-output/planning-artifacts/architecture.md#Addendum post-code-review Story 1.1] — driver neon-serverless, rol 'sistema' solo en event_log
- [Source: labradog-app/project-context.md] — reglas duras (capas, email aislado en lib/email.ts, actor único en actor.ts)
- [Source: labradog-app/src/lib/actor.ts] — stub getActor a conectar
- [Source: node_modules/better-auth/* (.d.mts)] — APIs verificadas de v1.6.14 (ver "Hechos verificados" arriba)
- Better Auth docs: https://better-auth.com/docs · Next.js 16 proxy: node_modules/next/dist/docs/

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
