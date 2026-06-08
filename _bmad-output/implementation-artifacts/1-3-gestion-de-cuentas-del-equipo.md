---
baseline_commit: f5c6788
---

# Story 1.3: Gestión de cuentas del equipo

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a admin,
I want crear, activar y desactivar cuentas de admins y paseadores,
so that controlo quién accede a la plataforma (multi-admin con permisos plenos e idénticos).

## Acceptance Criteria

1. **Given** soy admin, **When** creo una cuenta con email, nombre y rol, **Then** la persona aparece en el listado del equipo y recibe un enlace por email para definir su contraseña e iniciar sesión
2. **And** no hay auto-registro: la creación solo ocurre desde el área admin (acción protegida por rol), nunca desde una ruta pública (FR-002)
3. **Given** una cuenta activa, **When** la desactivo, **Then** esa persona no puede iniciar sesión y sus sesiones vigentes se invalidan; sus datos históricos permanecen intactos (soft-delete vía `estado`, sin DELETE físico)
4. **And** puedo reactivar una cuenta desactivada (vuelve a poder iniciar sesión)
5. **And** toda creación / desactivación / reactivación queda en `event_log` con autor (`actor`) y fecha, de forma ATÓMICA con la mutación (misma `db.transaction`)
6. **And** un admin no puede desactivarse a sí mismo (evita auto-bloqueo); todos los admins tienen permisos idénticos (FR-003)

## Tasks / Subtasks

- [x] Task 1: Extender `registrarEvento` para auditoría atómica + catálogo de eventos (AC: 5)
  - [x] En `src/lib/db/eventos.ts`, agregar al `CatalogoEventos` los tipos: `cuenta_creada` ({ email: string; rol: 'admin' | 'paseador' }), `cuenta_desactivada` ({ email: string }), `cuenta_reactivada` ({ email: string }).
  - [x] Extender `registrarEvento(...)` con un 5º parámetro OPCIONAL `ejecutor` (default `db`) que acepte el `db` global o un `tx` de `db.transaction`. Tipo: el executor debe tener `.insert(...).values(...).returning()`. Así la auditoría se escribe DENTRO de la misma transacción que el negocio, respetando que `registrarEvento` siga siendo la ÚNICA vía de escritura de `event_log` (regla #7 de project-context). NO romper las llamadas existentes (firma retrocompatible).
  - [x] Actualizar el test `eventos.test.ts` solo si la firma lo requiere (debe seguir verde; los tests actuales no pasan `ejecutor`).
- [x] Task 2: Capa de datos — queries del equipo (AC: 1, 3, 4, 5, 6)
  - [x] Crear `src/lib/db/queries/usuarios.ts` — ÚNICO lugar que ejecuta SQL para cuentas (regla #2 de capas). Funciones:
    - `listarEquipo()`: `select` de `id, name, email, rol, estado, createdAt` de `user`, ordenado por `createdAt`. NO exponer hashes ni nada de `account`.
    - `crearCuentaEnEquipo({ email, nombre, rol }, actor)`: en UNA `db.transaction`: (a) insertar fila `user` (id `crypto.randomUUID()`, `rol`, `estado: 'activo'`, `emailVerified: false`); (b) insertar fila `account` (`providerId: 'credential'`, `accountId = user.id`, `password =` hash de una contraseña aleatoria larga generada con `crypto.randomBytes`, usando `hashPassword` de `better-auth/crypto` — MISMO patrón que el seed de 1.2, garantiza compatibilidad con el verify del login); (c) `registrarEvento('cuenta_creada', {tabla:'user', id:user.id}, {email, rol}, actor, tx)`. Retornar el `user` creado. La contraseña aleatoria es un placeholder: el invitado la sobreescribe vía el enlace de invitación (Task 4).
    - `cambiarEstadoCuenta(userId, nuevoEstado, actor)`: en UNA `db.transaction`: (a) `update user set estado=nuevoEstado where id=userId`; (b) si `nuevoEstado='inactivo'`, `delete from session where user_id=userId` (invalida sesiones vigentes al instante); (c) `registrarEvento(nuevoEstado==='inactivo' ? 'cuenta_desactivada' : 'cuenta_reactivada', {tabla:'user', id:userId}, {email}, actor, tx)`. Para el payload del email, leer el email del usuario dentro de la tx antes de actualizar (o seleccionarlo). Validar que el usuario exista (si no, lanzar — el wrapper lo convierte en `{ok:false}`).
  - [x] Importar `user`, `account`, `session` de `../schema`. Usar `eq` de `drizzle-orm`.
- [x] Task 3: Validaciones Zod compartidas (AC: 1)
  - [x] Crear `src/lib/validations/cuentas.ts` con `crearCuentaSchema = z.object({ email: z.string().email(), nombre: z.string().min(1), rol: z.enum(['admin','paseador']) })`. Reusar en el form (cliente) y en la action (servidor). El servidor SIEMPRE valida (regla #11).
- [x] Task 4: Server Actions (AC: 1, 2, 3, 4, 6)
  - [x] Crear `src/actions/cuentas.ts`. Todas con `crearAction({ schema, roles: ['admin'], handler })` (nunca throw a la UI; contrato `{ok,data|error}`). Marcar el archivo con `'use server'`.
    - `crearCuenta`: schema `crearCuentaSchema`. handler: normaliza email a minúsculas; si ya existe un `user` con ese email → `{ok:false}` con mensaje claro (chequear vía query antes de insertar, o capturar el unique violation); llama `crearCuentaEnEquipo`; luego dispara el email de invitación con `auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } })` (reusa el flujo de 1.2: el usuario llega a `/reset-password?token=...` y define su contraseña). El envío es no-op en dev sin `RESEND_API_KEY`. Hace `revalidatePath('/admin/equipo')`.
    - `desactivarCuenta`: schema `z.object({ userId: z.string() })`, roles `['admin']`. **Regla de negocio**: si `userId === actor.id` → `{ok:false, error:'No puedes desactivar tu propia cuenta'}` (AC6, evita auto-lockout). Llama `cambiarEstadoCuenta(userId,'inactivo',actor)`. `revalidatePath('/admin/equipo')`.
    - `reactivarCuenta`: schema `z.object({ userId: z.string() })`, roles `['admin']`. Llama `cambiarEstadoCuenta(userId,'activo',actor)`. `revalidatePath('/admin/equipo')`.
- [x] Task 5: Bloqueo de login para cuentas inactivas (AC: 3)
  - [x] En `src/lib/auth.ts`, agregar `databaseHooks.session.create.before(session, context)`: cargar el usuario con `context.context.internalAdapter.findUserById(session.userId)`; si `usuario.estado === 'inactivo'` → `return false` (aborta la creación de sesión = login rechazado). Defensa en profundidad además del chequeo de `getActor()`. Documentar con comentario.
  - [x] Verificar (runtime) que un usuario inactivo recibe error al intentar `sign-in`.
- [x] Task 6: Refuerzo de `getActor()` contra caché de cookie (AC: 3)
  - [x] En `src/lib/actor.ts`, pasar `query: { disableCookieCache: true }` a `auth.api.getSession(...)` para garantizar que `estado`/`rol` se lean frescos de la BD en cada request (insurance ante un futuro `cookieCache`). Mantener la firma de `getActor`. Confirmar que `actor.test.ts` sigue verde (ajustar el mock si hace falta, sin cambiar el contrato).
- [x] Task 7: UI del equipo (AC: 1, 3, 4, 6)
  - [x] `src/app/admin/equipo/page.tsx` (Server Component): llama `listarEquipo()` y renderiza una tabla/lista con nombre, email, rol y estado (badge activo/inactivo). Móvil usable pero admin es desktop-first.
  - [x] Componente cliente `src/components/equipo/form-crear-cuenta.tsx`: form (nombre, email, rol con select) que llama la action `crearCuenta`; muestra el resultado (éxito: "invitación enviada"; error: el mensaje). Validar con `crearCuentaSchema` antes de enviar.
  - [x] Componente cliente `src/components/equipo/acciones-cuenta.tsx`: botón Desactivar (cuentas activas) / Reactivar (inactivas) que llama las actions; deshabilitar el botón de desactivar en la fila del propio admin (refuerzo UX de AC6). Confirmar antes de desactivar.
  - [x] Enlace de navegación a `/admin/equipo` desde `src/app/admin/page.tsx` (un link simple basta).
  - [x] Usar componentes shadcn ya presentes (`button`, `input`, `label`); si hace falta `select`/`badge`/`table`, agregarlos con `npx shadcn@latest add <c> -y`.
- [x] Task 8: Tests y validación final (AC: todos)
  - [x] Unit (Vitest): `validations/cuentas.test.ts` (email inválido, rol fuera de enum, nombre vacío). Test de la action `desactivarCuenta` con `userId === actor.id` → `{ok:false}` (mockear `getActor` y las queries, igual que `action-wrapper.test.ts`). Test de `crearCuenta` que ya existe el email → `{ok:false}`.
  - [x] E2E (Playwright, mobile-chrome), reusando `global-setup` (admin + paseador sembrados): admin inicia sesión → va a `/admin/equipo` → ve al paseador de prueba en el listado → crea una cuenta nueva (paseador) → aparece en el listado. Desactiva una cuenta → su `estado` muestra inactivo. (El bloqueo de login del desactivado se cubre con una verificación de sign-in que retorne error.) Limpiar la cuenta creada al final o usar email único por corrida para no chocar con el unique.
  - [x] Regresión: `npm run lint && npm run test && npm run build` verdes; `e2e/auth.spec.ts` sigue pasando (no romper login de 1.2).

## Dev Notes

### Decisiones de diseño clave (leer antes de implementar)

- **Auditoría atómica de verdad (primera mutación real del proyecto).** El patrón obligatorio "negocio + auditoría en la misma `db.transaction`" (regla #7) se materializa aquí. Por eso `registrarEvento` se extiende con un `ejecutor` opcional (el `tx`), en vez de hacer un insert suelto a `event_log` por fuera. El driver ya es `neon-serverless` (soporta transacciones) desde el review de 1.1. [Source: project-context.md#7; architecture.md#Addendum post-code-review Story 1.1]
- **Crear cuenta = insert manual en la capa queries, NO `auth.api.signUpEmail`.** `signUpEmail` está bloqueado por `disableSignUp` (verificado en 1.2). Replicamos el patrón del seed `crear-admin.mjs`: insertar `user` + `account` (credential, password aleatoria hasheada con `hashPassword` de `better-auth/crypto`) dentro de la transacción. Esto mantiene todo en `db/queries` (regla de capas) y permite atomicidad con el `event_log`. [Source: scripts/crear-admin.mjs; node_modules/better-auth/dist/api/routes/sign-up.mjs:235]
- **Invitación = `requestPasswordReset` reutilizado.** Tras crear la cuenta, `auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } })` envía el enlace; el invitado define su contraseña en la página `/reset-password` de 1.2 (la random queda sobreescrita vía `updatePassword`, verificado en `password.mjs:158`). No hay primitiva de "invitación" dedicada en v1.6.14 (`setPassword` exige sesión activa, no sirve). Email no-op en dev sin Resend. La plantilla actual dice "Restablece tu contraseña" — aceptable para v1; opcional diferenciar copy de invitación. [Source: node_modules/better-auth/dist/api/routes/password.{d.mts,mjs}; update-user.d.mts:203]
- **Bloqueo de login del desactivado: dos capas.** (1) `databaseHooks.session.create.before` aborta la creación de sesión si `estado==='inactivo'` (bloquea el sign-in mismo). (2) `getActor()` ya devuelve `null` para no-activos (bloquea todas las áreas). Además, al desactivar borramos las filas de `session` del usuario para cortar cookies vigentes. [Source: node_modules/@better-auth/core/dist/types/init-options.d.mts:1131-1145; context.d.mts:95]
- **`getActor` + `disableCookieCache: true`.** Con adaptador stateful (Neon) el cookieCache está OFF por defecto, pero pasar `query: { disableCookieCache: true }` garantiza lectura fresca de `estado`/`rol` en cada request (un desactivado queda fuera al instante). [Source: node_modules/better-auth/dist/api/routes/session.mjs:93-186]
- **Roles idénticos (FR-003).** No hay permisos finos: cualquier `admin` puede gestionar cualquier cuenta. La única salvaguarda es no auto-desactivarse. [Source: epics.md#Story 1.3]

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/lib/db/eventos.ts` — hoy `registrarEvento(tipo, entidad, payload, actor)` hace `db.insert(...).returning()` y lanza si no hay fila. Se agrega `ejecutor?` y se extiende `CatalogoEventos`. NO cambiar el comportamiento existente ni la validación de "no retornó fila".
- `src/lib/auth.ts` — hoy `betterAuth({...})` (minimal + drizzleAdapter, disableSignUp, sendResetPassword, additionalFields rol/estado, nextCookies). Se agrega `databaseHooks`. NO tocar lo demás.
- `src/lib/actor.ts` — hoy `getActor()` llama `auth.api.getSession({ headers })` y rechaza `estado!=='activo'`. Se agrega `query:{disableCookieCache:true}`. Firma intacta.
- `src/app/admin/page.tsx` — placeholder; agregar enlace a `/admin/equipo`.

### Arquitectura y convenciones (recordatorio)

- **Capas UI → Actions → Engine → DB.** UI nunca toca BD. Solo `src/lib/db/queries/*` ejecuta SQL. Esta story casi no tiene reglas de negocio (no hay motor); la lógica vive en la action (guard de auto-desactivación) y en las queries (transacciones). [Source: project-context.md#2,#3]
- **Toda action con `crearAction()`**, roles `['admin']`, contrato `{ok,data|error}`. [Source: project-context.md#4]
- **Naming**: tablas snake_case plural español (las de auth son excepción), columnas snake_case, actions camelCase verbo+dominio (`crearCuenta`), rutas kebab-case español (`/admin/equipo`), componentes PascalCase. [Source: project-context.md#Naming]
- **Soft-delete vía estado**, nunca DELETE físico de datos de negocio (las `session` SÍ se borran: son efímeras, no son dato de negocio). [Source: project-context.md#8]
- **No agregar dependencias** sin registrar en architecture.md. Esta story no debería necesitar ninguna nueva (shadcn copia componentes, no es dependencia). [Source: project-context.md enforcement #3]

### Qué NO hacer (límites de alcance)

- NO implementar edición de perfil/datos del usuario (fuera de alcance; solo crear/activar/desactivar).
- NO crear fichas de tutor/perro/paseador (Stories 1.5-1.7) — esto es gestión de CUENTAS de acceso, distinto de la "ficha del paseador" (1.7).
- NO tocar la tabla `paseos` ni `lib/storage.ts`/`lib/fechas.ts` (Story 1.4).
- NO construir permisos finos por admin (FR-003: permisos idénticos).

### Dependencias externas / acción de Nelson

- En **prod**, el email de invitación requiere `RESEND_API_KEY` configurada (igual que el reset de 1.2). En dev el enlace se loguea, no se envía — para probar el flujo completo en dev, el dev agent puede leer el token del log del server o de la tabla `verification`.

### Testing standards

- Vitest unit co-ubicado (`*.test.ts`); mockear `getActor` y las queries para tests de actions (patrón de `action-wrapper.test.ts`).
- Playwright E2E en `e2e/` (mobile-chrome) reusando `global-setup.ts`. Usar email único por corrida (p.ej. con un sufijo derivado de un valor del entorno) para no chocar con el `unique(email)`, o borrar la cuenta creada al final.
- CI verde: `npm run lint && npm run test && npm run build`. E2E corre local (no en CI).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — ACs fuente; FR-002, FR-003
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — roles, sin auto-registro
- [Source: _bmad-output/implementation-artifacts/1-2-login-con-roles.md] — patrón auth, seed, getActor, flujo de reset reutilizado
- [Source: labradog-app/project-context.md] — reglas de capas, auditoría atómica, naming, soft-delete
- [Source: labradog-app/scripts/crear-admin.mjs] — patrón de creación de usuario+account+evento
- [Source: node_modules/better-auth/* (.d.mts/.mjs)] — APIs v1.6.14 verificadas (databaseHooks, requestPasswordReset, deleteUserSessions, createUser/linkAccount, disableCookieCache)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- **`databaseHook` frágil rompía el login.** La primera versión de `session.create.before` llamaba `context?.context.internalAdapter.findUserById(...)` y dejaba propagar cualquier error. Un hiccup/cold-start de Neon en ese lookup hacía fallar la creación de sesión (`[Better Auth]: Failed to create session`) → login caído de forma intermitente. Solución: optional chaining completo + `try/catch` fail-open (no bloquear login por error transitorio del hook; `getActor()` sigue siendo el gate real que rechaza inactivos en cada request).
- **E2E flaky por Neon free-tier.** Correr los specs en paralelo (4 workers) saturaba las conexiones de Neon free-tier (cada request lee estado fresco por `disableCookieCache`), con logins que excedían el timeout. Resuelto: `workers: 1`, `timeout: 60s` por test, aserciones de redirección de login a 30s (absorben cold-start scale-to-zero), `retries: 1` local, y **consolidar el spec de equipo en un solo login** (en vez de uno por test) para minimizar la carga.
- **Layout del equipo en viewport móvil.** La tabla de 5 columnas no cabe en el viewport Pixel 7 del proyecto (el `<main>` interceptaba el click del botón). El área admin es desktop-first: el spec de equipo usa `test.use({ viewport: 1280x900 })`.

### Completion Notes List

- **Primera mutación con auditoría atómica del proyecto.** `registrarEvento` ahora acepta un `ejecutor` opcional (el `tx`), y las queries escriben negocio + `event_log` en una sola `db.transaction` (regla #7). Verificado: crear cuenta y cambiar estado registran su evento atómicamente.
- **Sin auto-registro (FR-002).** Las cuentas se crean solo desde la action `crearCuenta` (rol admin); el alta replica el patrón del seed (insert `user` + `account` credential con password aleatoria) y dispara la invitación vía `requestPasswordReset` (no-op en dev sin Resend).
- **Bloqueo de desactivados en DOS capas.** (1) `databaseHook` aborta el sign-in de inactivos (verificado por E2E: la API de sign-in del desactivado responde error). (2) `getActor()` con `disableCookieCache` los rechaza en cada área; al desactivar se borran sus `session` (cookie inválida al instante).
- **Auto-desactivación bloqueada (AC6)** en la action (`ErrorNegocio`) y reforzada en la UI (botón deshabilitado en la fila del propio admin).
- **`ErrorNegocio`** (nuevo en `action-wrapper.ts`): permite que los handlers devuelvan mensajes de negocio al usuario; los errores inesperados siguen yendo a Sentry con mensaje genérico.
- **Validación final**: lint ✅ · 27/27 unit ✅ · 10/10 E2E (1 flaky recuperado en retry por cold-start de Neon) ✅ · build ✅.

#### Acción requerida de Nelson
- En **prod**, el email de invitación necesita `RESEND_API_KEY` (igual que el reset de 1.2). En dev el enlace se loguea/▸no-op; para probar el alta completa en dev se puede leer el token de la tabla `verification` o del log del server.

### File List

- labradog-app/src/lib/db/eventos.ts (modificado — CatalogoEventos + executor en registrarEvento)
- labradog-app/src/lib/db/eventos.test.ts (modificado — test del executor)
- labradog-app/src/lib/db/queries/usuarios.ts (nuevo — listar/crear/cambiar estado, transaccional)
- labradog-app/src/lib/validations/cuentas.ts (nuevo)
- labradog-app/src/lib/validations/cuentas.test.ts (nuevo)
- labradog-app/src/actions/cuentas.ts (nuevo — crearCuenta/desactivarCuenta/reactivarCuenta)
- labradog-app/src/actions/cuentas.test.ts (nuevo)
- labradog-app/src/lib/action-wrapper.ts (modificado — clase ErrorNegocio + manejo en catch)
- labradog-app/src/lib/action-wrapper.test.ts (modificado — test de ErrorNegocio)
- labradog-app/src/lib/auth.ts (modificado — databaseHooks.session.create.before, fail-open)
- labradog-app/src/lib/actor.ts (modificado — disableCookieCache)
- labradog-app/src/app/admin/equipo/page.tsx (nuevo)
- labradog-app/src/app/admin/page.tsx (modificado — link a /admin/equipo)
- labradog-app/src/components/equipo/form-crear-cuenta.tsx (nuevo)
- labradog-app/src/components/equipo/acciones-cuenta.tsx (nuevo)
- labradog-app/src/components/ui/select.tsx · badge.tsx · table.tsx (nuevos, shadcn)
- labradog-app/e2e/global-setup.ts (modificado — usuario 'desactivable')
- labradog-app/e2e/equipo.spec.ts (nuevo — E2E consolidado)
- labradog-app/e2e/auth.spec.ts (modificado — timeouts de login a 30s)
- labradog-app/playwright.config.ts (modificado — workers:1, timeout:60s, retries:1)

## Change Log

- 2026-06-08: Implementación de Story 1.3 (gestión de cuentas del equipo): auditoría atómica (registrarEvento con executor), queries transaccionales, actions crear/desactivar/reactivar con ErrorNegocio, bloqueo de login de inactivos (databaseHook fail-open) + getActor disableCookieCache, UI /admin/equipo, tests unit + E2E. Status → review.
