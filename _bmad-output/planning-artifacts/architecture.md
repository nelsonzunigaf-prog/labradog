---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-06'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md
  - _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/addendum.md
  - _bmad-output/planning-artifacts/briefs/brief-labradog-2026-06-06/brief.md
  - _bmad-output/planning-artifacts/briefs/brief-labradog-2026-06-06/addendum.md
workflowType: 'architecture'
project_name: 'labradog'
user_name: 'Nelson'
date: '2026-06-06'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Requisitos funcionales — lectura arquitectónica:**

Los 40 FRs del PRD se reducen a un CRUD bien estructurado + 3 mecanismos especiales:

1. **CRUD relacional clásico** (FR-001→009, 039): usuarios/roles, fichas tutor/perro/paseador — entidades con relaciones simples.
2. **Máquina de estados de capacitación** (FR-010→018): etapas secuenciales con desbloqueo, tests autocorregibles, veredictos de evaluador, certificación como gate. El contenido (9 etapas, banco de 100 preguntas) se migra desde Word — trabajo de seeding de datos, no de código.
3. **Motor de recurrencia** (FR-019→025): generación de paseos semanales desde plantillas recurrentes + excepciones (cancelar/reagendar/reasignar) + validaciones (certificación, topes, ratio). La pieza con más lógica de negocio.
4. **Flujo de paseo con estados** (FR-026→032): pendiente → checklist completa → en curso → completado/cancelado. La checklist como bloqueante de transición es regla de servidor, no de UI.
5. **Motor de cobros** (FR-033→038, 040): 6 modalidades × precio congelado por paseo × comisión fijada al completar — exige inmutabilidad de datos económicos (snapshot de precio/% en cada paseo).

**NFRs que dictan la arquitectura:**

| NFR | Implicancia dura |
|---|---|
| IA-first, sin dev activo (07) | Stack mainstream con máxima documentación; monolito, no microservicios; mínimas piezas móviles |
| < $20 USD/mes (06) | Hosting serverless/managed con free tier generoso; sin servidores dedicados |
| Móvil primero paseador (02) | Web responsive; sin app nativa |
| Auditoría total (04) | Autor + timestamp en cada escritura — patrón transversal desde el día 1, no retrofit |
| Respaldo diario (05) | BD gestionada con backups automáticos incluidos |

**Escala y complejidad:**

- Complejidad: baja-media (lógica de negocio rica, volumen mínimo: ~400 paseos/mes, <10 usuarios concurrentes)
- Dominio técnico: full-stack web (un solo deployable)
- Componentes estimados: 1 web app + 1 BD relacional + almacenamiento de fotos

### Technical Constraints & Dependencies

- Sin integraciones externas en v1 (WhatsApp manual, pagos por transferencia registrada) — cero dependencias de terceros críticas
- Datos personales Ley 19.628 (Chile): minimización, sin transferencia a terceros
- Fotos de paseos (FR-030): único requisito de almacenamiento de archivos
- Contenido de capacitación: migración one-shot desde documentos Word
- El reporte generado debe formatear nativamente para WhatsApp (saltos de línea, emojis, copiado en un toque)

### Cross-Cutting Concerns Identified

1. **Auditoría**: autor/fecha en toda escritura relevante.
2. **Inmutabilidad económica**: precios y % de comisión congelados por paseo al momento del evento.
3. **Reglas de negocio en servidor**: checklist bloqueante, gate de certificación, ratio de perros — nunca solo en UI.
4. **Taxonomías del método como catálogos centralizados**: estados emocionales, incidentes, red flags, grupos de raza, especialidades de caminata.
5. **Zona horaria Chile**: agenda recurrente + cambios de hora CLT/CLST (fuente clásica de bugs de agenda).
6. **Conectividad intermitente** *(lente paseador)*: flujos de checklist/registro/fotos con cola local/reintentos y degradación elegante; UI operable con una mano; fotos comprimidas para redes lentas.
7. **Concurrencia multi-admin** *(lente admin)*: detección de edición simultánea sobre la agenda — evitar doble asignación silenciosa.
8. **Consultas de negocio** *(lente socio)*: modelo de datos que haga triviales los reportes (ingresos, paseos por plan, avance capacitación, % checklist) + export CSV. *Nota PM: el PRD no tiene FR de reportes de negocio — mini-gap anotado.*
9. **Guardarraíles para mantención IA** *(lente NFR-07)*: `project-context.md` para agentes, seeds reproducibles y tests E2E de flujos críticos (checklist bloqueante, cálculo de comisiones) como entregables del proyecto, no opcionales.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (un solo deployable: UI + API + lógica de negocio), según el análisis de contexto.

### Starter Options Considered

| Opción | Qué da | Veredicto |
|---|---|---|
| **create-next-app (Next.js 16.2)** | TS + Tailwind + ESLint + App Router + Turbopack + AGENTS.md para IA | ✅ Seleccionado — máxima documentación = máxima precisión de la IA mantenedora |
| create-t3-app v7.40 | Lo anterior + tRPC + auth preconfigurado | ✗ tRPC agrega indirección innecesaria para un CRUD de 2 roles |
| Boilerplates SaaS pagados | Multi-tenancy, billing | ✗ Sobredimensionado; complejidad que el PRD excluyó |

### Selected Starter: create-next-app + piezas mínimas

**Rationale:** El stack más mainstream y documentado del ecosistema (NFR-07: mantenible por IA sin dev activo), con costo total ~$5-7 USD/mes (NFR-06).

**Initialization Command** (primera story de implementación):

```bash
npx create-next-app@latest labradog-app --yes
npm install drizzle-orm better-auth
```

**Architectural Decisions Provided by Starter:**

- **Language & Runtime:** TypeScript estricto, Node.js
- **Styling Solution:** Tailwind CSS
- **Build Tooling:** Turbopack
- **Code Organization:** App Router con `src/`, alias `@/*`
- **Development Experience:** ESLint, hot reload, AGENTS.md generado

**Piezas agregadas (versiones verificadas jun-2026):**

- ORM: **Drizzle 0.45** (TypeScript nativo, SQL-like; superó a Prisma en descargas may-2026; ideal IA-first)
- Auth: **Better Auth v1.6** (email+password+roles; recomendado por los mantenedores de NextAuth para proyectos nuevos)
- BD: **Neon Postgres** free tier (autoscale-a-cero; 100 CU-h/mes y 0.5GB sobran para ~10 usuarios; backups → NFR-05)
- Fotos: **Cloudflare R2** (10GB free, egress $0)
- Hosting: **Railway** ($5/mes, uso comercial permitido — Vercel Hobby lo prohíbe y Pro cuesta $20/usuario/mes)

**Costo total estimado: ~$5-7 USD/mes** (NFR-06 ✅)

## Core Architectural Decisions

### Decision Priority Analysis

**Críticas (bloquean implementación):** patrón Server Actions + RSC, modelado Drizzle + migraciones, Better Auth con roles, snapshot económico por paseo, zona horaria UTC/America-Santiago.
**Importantes (moldean la arquitectura):** shadcn/ui, cola local para checklist/registro, auditoría con event_log, testing Vitest + Playwright.
**Diferidas (post-prueba):** capa API para clientes externos (app tutor), staging, caché, PWA offline completa, rate limiting avanzado.

### Data Architecture

- **Modelado:** schema Drizzle en código TypeScript; migraciones con `drizzle-kit`. Una sola fuente de verdad versionada.
- **Validación:** Zod compartido cliente/servidor; el servidor siempre valida (reglas del método nunca solo en UI).
- **Auditoría:** columnas `created_by/created_at/updated_by/updated_at` en todas las tablas + tabla `event_log` para operaciones sensibles (evaluaciones, pagos, overrides de comisión, cancelaciones cobrables).
- **Inmutabilidad económica:** al completarse un paseo se escriben snapshot de precio (plan × bloque) y % de comisión. Cambios de tarifa/% nunca reescriben historia.
- **Zona horaria:** almacenamiento UTC; render y cálculo de recurrencia en `America/Santiago`.
- **Caché:** ninguna (volumen mínimo; complejidad sin retorno).

### Authentication & Security

- **Better Auth v1.6:** email + password, sesiones por cookie, recuperación de contraseña.
- **Roles:** columna `role` (admin | paseador) + middleware de Next.js por grupo de rutas (`/admin/*`, `/paseador/*`).
- **Sin auto-registro:** cuentas creadas por admins (FR-002).
- **Cifrado:** at-rest de Neon + HTTPS extremo a extremo. Suficiente para Ley 19.628 a esta escala.

### API & Communication Patterns

- **Server Actions + React Server Components.** Sin capa REST separada en v1 (no hay consumidores externos).
- **Errores:** resultados tipados `{ ok, data | error }`; nunca excepciones silenciosas.
- **Módulos de negocio desacoplados de la UI** (`src/lib/engine/*`): recurrencia, cobros, certificación — reutilizables cuando llegue la capa API post-prueba.

### Frontend Architecture

- **shadcn/ui:** componentes copiados al repo (sin dependencia de librería), sobre Tailwind.
- **Estado:** RSC + `useActionState` para formularios; sin librería de estado global.
- **Conectividad intermitente:** cola local (localStorage + reintento al reconectar) SOLO en checklist pre-paseo y registro de paseo. Sin PWA offline completa.
- **Móvil primero** en las vistas del paseador; desktop primero en admin.

### Infrastructure & Deployment

- **CI/CD:** GitHub → auto-deploy Railway; GitHub Actions corre lint + tests en cada PR.
- **Ambientes:** local + producción (staging diferido).
- **Monitoreo:** logs de Railway + Sentry free tier (errores llegan solos — no hay dev mirando).
- **Backups:** automáticos de Neon (NFR-05).
- **Testing:** Vitest para motores (recurrencia, cobros, certificación) + Playwright E2E para flujos críticos (checklist bloqueante, gate de certificación, liquidación).

### Decision Impact Analysis

**Secuencia de implementación:** 1) scaffold + auth + roles → 2) fichas (tutor/perro/paseador) → 3) capacitación (contenido seed + tests + evaluaciones) → 4) agenda (recurrencia + excepciones) → 5) registro (checklist + paseo + reporte) → 6) cobros (modalidades + liquidaciones) → transversal: auditoría desde el paso 1.

**Dependencias cruzadas:** el gate de certificación (módulo capacitación) es validación de la agenda; el snapshot económico (cobros) se escribe en el flujo de registro; la cola local toca solo los formularios del paseador.

## Implementation Patterns & Consistency Rules

### Conflicto #1: idioma del dominio

El negocio habla español; la IA tiende a inglés. **Regla: sustantivos de dominio SIEMPRE en español** (paseo, paseador, tutor, perro, etapa, liquidacion — sin tildes en código), estructura técnica en inglés (get, create, Card, Form).

✅ `paseos`, `getPaseosByPaseador()`, `PaseoCard.tsx` · ❌ `walks`, `getWalks()`, `dog_walks`

### Naming Patterns

| Ámbito | Regla | Ejemplo |
|---|---|---|
| Tablas BD | snake_case plural español | `paseos`, `evaluaciones`, `recurrencias` |
| Columnas | snake_case; FK = `<entidad>_id` | `tutor_id`, `estado_emocional` |
| Enums BD | snake_case | `estado_paseo: 'pendiente' \| 'en_curso' \| 'completado' \| 'cancelado'` |
| Componentes | PascalCase, archivo igual | `ChecklistPrePaseo.tsx` |
| Server Actions | verbo + dominio, camelCase | `completarPaseo()`, `aprobarEtapa()` |
| Rutas | kebab-case español | `/admin/paseos`, `/paseador/mi-agenda` |

### Structure Patterns

```
src/
├── app/                    # rutas: (auth), admin/, paseador/
├── components/ui/          # shadcn (no tocar a mano)
├── components/<feature>/   # componentes por feature
├── lib/engine/             # motores PUROS: recurrencia.ts, cobros.ts, certificacion.ts
├── lib/db/                 # schema.ts, queries por feature
├── lib/validations/        # schemas Zod compartidos
└── actions/                # server actions por feature
```

- Tests co-ubicados (`recurrencia.test.ts` junto a `recurrencia.ts`); E2E en `e2e/`
- Los motores en `lib/engine/` son **funciones puras sin I/O**: reciben datos, devuelven resultados; las actions orquestan

### Format Patterns

- Server Actions retornan siempre `{ ok: true, data } | { ok: false, error: string }` — nunca throw hacia la UI
- Fechas: ISO 8601 UTC en BD/wire; formateo `America/Santiago` solo en render
- Dinero: **enteros en CLP** (sin decimales, sin floats) — `precio_clp: 10000`
- JSON/TS: camelCase; BD: snake_case (Drizzle mapea)

### Process Patterns

- Mutaciones: validar Zod → verificar rol → ejecutar motor → escribir auditoría → `revalidatePath`
- Reglas del método viven en el motor, nunca en el componente (la UI solo refleja)
- Auditoría: toda mutación escribe `*_by/*_at`; las sensibles (pagos, overrides, evaluaciones) agregan fila en `event_log`
- Loading: `useActionState` pending — sin spinners globales

### Enforcement Guidelines — todo agente IA DEBE

1. Leer `project-context.md` antes de tocar código.
2. Correr `npm run lint && npm run test` antes de dar por cerrada una tarea.
3. No agregar dependencias nuevas sin registrar la decisión en `architecture.md`.
4. Nuevas tablas siguen el patrón de auditoría (4 columnas) sin excepción.

## Project Structure & Boundaries

### Complete Project Directory Structure

```
labradog-app/
├── package.json / tsconfig.json / next.config.ts / tailwind.config.ts
├── drizzle.config.ts
├── .env.example                  # DATABASE_URL, BETTER_AUTH_SECRET, R2_*
├── AGENTS.md                     # generado por create-next-app
├── project-context.md            # guardarraíl IA (concern #9)
├── .github/workflows/ci.yml      # lint + test en cada PR
├── e2e/                          # Playwright
│   ├── checklist-bloqueante.spec.ts
│   ├── certificacion-gate.spec.ts
│   └── liquidacion.spec.ts
├── drizzle/                      # migraciones generadas
├── scripts/
│   └── seed-capacitacion.ts      # migración one-shot de los Word (etapas + banco 100 preguntas)
├── public/
└── src/
    ├── middleware.ts             # auth + roles por grupo de ruta
    ├── app/
    │   ├── (auth)/login/
    │   ├── admin/                # rol admin
    │   │   ├── page.tsx          # tablero (paseos hoy, alertas, incidentes)
    │   │   ├── tutores/ · perros/ · paseadores/
    │   │   ├── agenda/           # vista global + recurrencias
    │   │   ├── capacitacion/     # avance + evaluaciones pendientes
    │   │   ├── cobros/           # estados de cuenta + pagos + saldos prepago
    │   │   └── liquidaciones/
    │   └── paseador/             # rol paseador (móvil primero)
    │       ├── page.tsx          # mi día
    │       ├── mi-agenda/
    │       ├── paseo/[id]/       # checklist → en curso → registro → reporte
    │       ├── mi-capacitacion/  # etapas, tests, examen
    │       └── mis-comisiones/
    ├── components/
    │   ├── ui/                   # shadcn
    │   └── paseos/ · agenda/ · capacitacion/ · cobros/ · fichas/
    ├── actions/                  # server actions por feature
    │   └── paseos.ts · agenda.ts · capacitacion.ts · cobros.ts · fichas.ts
    ├── lib/
    │   ├── auth.ts               # Better Auth config
    │   ├── db/
    │   │   ├── schema.ts         # TODAS las tablas (1 archivo: visión completa para IA)
    │   │   └── queries/          # por feature
    │   ├── engine/               # motores puros (sin I/O)
    │   │   ├── recurrencia.ts (+test)   # genera paseos semanales, TZ Chile
    │   │   ├── cobros.ts (+test)        # 6 modalidades, snapshot, saldos
    │   │   ├── certificacion.ts (+test) # gate, desbloqueo etapas, scoring tests
    │   │   └── reportes.ts (+test)      # genera texto WhatsApp por plan
    │   ├── validations/          # Zod por feature
    │   ├── storage.ts            # R2 (fotos)
    │   └── offline-queue.ts      # cola local checklist/registro
    └── types/
```

### Requirements to Structure Mapping

| Módulo PRD | UI | Actions | Motor | Tests |
|---|---|---|---|---|
| 0 Base/fichas (FR-001→009, 039) | `admin/tutores,perros,paseadores` | `fichas.ts` | — | unit queries |
| 1 Capacitación (FR-010→018) | `paseador/mi-capacitacion`, `admin/capacitacion` | `capacitacion.ts` | `certificacion.ts` | unit + E2E gate |
| 2 Agenda (FR-019→025) | `admin/agenda`, `paseador/mi-agenda` | `agenda.ts` | `recurrencia.ts` | unit TZ/excepciones |
| 3 Registro (FR-026→032) | `paseador/paseo/[id]` | `paseos.ts` | `reportes.ts` | E2E checklist |
| 4 Cobros (FR-033→040) | `admin/cobros,liquidaciones` | `cobros.ts` | `cobros.ts` | unit + E2E liquidación |

### Architectural Boundaries

- **UI → Actions → Engine → DB**: la UI nunca toca la BD; los motores nunca tocan I/O.
- **Datos**: solo `lib/db/queries/*` ejecuta SQL; `schema.ts` es el único dueño del modelo.
- **Externos**: R2 aislado en `storage.ts` y email aislado en `lib/email.ts` (Resend) — únicos puntos de salida en v1.
- **Flujo crítico**: completar paseo → `engine/cobros` calcula snapshot → action escribe paseo + event_log → `revalidatePath` de agenda y cobros.

## Architecture Validation Results

_Auditoría independiente (subagente revisor) contra el PRD: informe completo en `validation-arquitectura.md`. Cobertura 40/40 FRs y 7/7 NFRs. Dos brechas críticas y dos importantes detectadas y resueltas:_

### Resoluciones de brechas

- **Generación de paseos recurrentes (FR-019):** materialización idempotente con horizonte de 14 días al consultar la agenda; clave única `(recurrencia_id, fecha_local)`; cálculo en hora local `America/Santiago` convertido a UTC por ocurrencia (inmune a DST). Sin cron ni infra extra.
- **Checklist bloqueante offline (FR-026):** bloqueo local-first — la UI bloquea iniciar sin checklist siempre; sin red, checklist e inicio se capturan con hora del dispositivo y se encolan; el servidor valida el orden de eventos (checklist → inicio → fin) al sincronizar y rechaza fin sin checklist previa.
- **Concurrencia multi-admin:** bloqueo optimista con columna `version` en paseos/asignaciones; conflicto → "este paseo cambió, recarga".
- **Vencimiento estado transición 30 días (FR-017):** chequeo perezoso en el gate de asignación + alerta en tablero admin 5 días antes. Sin job.
- **Menores:** regla 2+ red flags en `lib/engine/fichas.ts`; tabla `perro_compatibilidades`; examen con seed persistida por rendición (auditable); notificación de incidentes vía tablero admin en v1 (email diferido).

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** alta

**Key Strengths:** reglas del método como invariantes de servidor; motores puros testeables; costo $5-7 USD/mes; documento autosuficiente para agentes IA; cero dependencias críticas de terceros.

**Areas for Future Enhancement:** capa API para portal tutor (post-prueba), WhatsApp Business API, staging, PWA offline completa.

### Addendum post-validación (FR-041, decisión de Nelson 06-06-2026)

**Notificaciones por email en v1:** Resend (free tier 3.000/mes) aislado en `lib/email.ts`; cron diario de Railway (7:00 America/Santiago) invoca una ruta protegida que envía el resumen matinal "tus paseos de hoy" a cada paseador; las actions de agenda disparan emails transaccionales (asignación/reasignación/cancelación) y el registro de incidente envía email inmediato a admins. Plantillas en español, texto plano simple. Push/WhatsApp diferidos. Costo: $0 (free tier). Nota: el cron es la única pieza programada del sistema; su ejecución es idempotente (re-envío seguro marcando notificaciones enviadas en BD).

### Addendum post-code-review Story 1.1 (07-06-2026)

1. **Driver de BD: `neon-serverless` (WebSocket, Pool), NO `neon-http`.** El driver HTTP no soporta transacciones; el patrón obligatorio "escribir negocio + auditoría" exige atomicidad (`db.transaction`). Railway es servidor persistente: WebSocket sin contras. Node 22+ trae WebSocket global.
2. **Tercer rol de auditoría `'sistema'`** (solo en `event_log.actor_rol`, NO en cuentas de usuario): identifica escrituras de procesos automáticos (cron de notificaciones FR-041, seeds, materialización de paseos). Los roles de sesión siguen siendo solo `admin | paseador`. Fuente única del tipo: `src/lib/actor.ts` (`ActorEvento`).
3. **`event_log` reforzado:** columna `actor_rol` (auditoría completa del actor), índices `(entidad, entidad_id)` y `(created_at)`, e inmutabilidad impuesta en BD vía trigger `event_log_solo_insert` (rechaza UPDATE/DELETE) — migración `0001`.

### Implementation Handoff

**AI Agent Guidelines:**

- Seguir todas las decisiones arquitectónicas exactamente como están documentadas.
- Aplicar los patrones de implementación de forma consistente en todos los componentes.
- Respetar la estructura del proyecto y sus fronteras (UI → Actions → Engine → DB).
- Consultar este documento ante cualquier duda arquitectónica.

**First Implementation Priority:**

```bash
npx create-next-app@latest labradog-app --yes
npm install drizzle-orm better-auth
```
