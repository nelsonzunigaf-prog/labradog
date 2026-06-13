# Labradog — Arquitectura y funcionalidades

> Documento generado a partir del código real del repositorio (junio 2026).
> Describe la arquitectura implementada, las funcionalidades por superficie y,
> en detalle, qué puede y qué no puede hacer cada rol.

---

## 1. Visión general

**Labradog** es una plataforma B2C premium de paseo canino en Chile. No es un
marketplace: es un operador propio con método de capacitación y certificación
de paseadores como activo central. El sistema cubre todo el ciclo del negocio:

1. **Captación** — landing pública captura leads con consentimiento legal.
2. **Calificación** — CRM con pipeline y entrevista de intake estructurada.
3. **Activación** — alta del tutor, perro, suscripción y asignación recurrente de paseador.
4. **Capacitación** — LMS interno de 9 etapas con gate binario (apto / no apto).
5. **Certificación** — paseo supervisado evaluado por un evaluador; crea el Walker.
6. **Operación** — generación automática de paseos, ejecución con GPS/fotos, reportes al tutor.
7. **Cobro** — pago mensual (manual durante el piloto; Flow.cl diferido), conciliación mensual.
8. **Control** — incidentes, auditoría, cumplimiento Ley 21.020 y 19.628.

### Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) + TypeScript strict |
| Base de datos | PostgreSQL + Prisma (cliente singleton en `src/server/db.ts`) |
| Auth | Auth.js (NextAuth v5), credenciales email/password, multi-rol por `Membership` |
| UI | Tailwind CSS + shadcn/ui, mobile-first en tutor y walker |
| Storage | Supabase Storage (fotos de paseo) |
| Emails | Resend (reportes, recordatorios, digests) |
| Deploy | Vercel (labradog.vercel.app) + crons de Vercel |
| Observabilidad | Sentry (errores en crons y servicios) |

### Decisiones de arquitectura

- **Monolito modular**: las 5 superficies (landing, admin, tutor, walker, LMS)
  viven en el mismo Next.js, separadas por grupos de rutas en `src/app/`.
- **Server Components + Server Actions**, sin API REST separada. Toda mutación
  pasa por una Server Action validada con zod que delega en un servicio de
  `src/server/services/`.
- **Multi-tenant desde el día uno**: toda entidad de negocio tiene
  `organizationId` y todo servicio recibe un `AuthContext` y filtra por
  `ctx.organizationId`. Hoy existe una sola organización (`slug: "labradog"`).
- **`id` interno (cuid), `code` visible**: nunca se exponen ids internos al
  usuario. Códigos humanos: `WLK-` (paseo), `SUB-` (suscripción), `CRT-`
  (certificación), `LD-` (lead), `INC-` (incidente), `INT-` (entrevista).
  Generados en `src/lib/codes.ts`.
- **Soft-delete por defecto**: los estados terminan en `CANCELLED` / `ARCHIVED`
  / `INACTIVE`, nunca borrado duro.
- **Zona horaria**: persistencia en UTC; la recurrencia de paseos se define en
  hora de Santiago y se convierte a UTC en `src/server/services/walks.ts`.

---

## 2. Modelo de autenticación y autorización

### AuthContext (`src/lib/auth.ts`)

Tras el login, `requireSession()` resuelve la **membership activa primaria**
del usuario en su organización y construye:

```ts
type AuthContext = {
  userId: string;
  email: string;
  organizationId: string;  // aislamiento multi-tenant
  role: Role;              // rol principal
  walkerId?: string;       // solo si role = WALKER
  applicantId?: string;    // solo si role = APPLICANT
  tutorId?: string;        // solo si role = TUTOR
};
```

Si el usuario no tiene membership activa se lanza `TenantViolationError`.
`requireRole([...])` protege tanto los layouts de cada superficie como cada
función de servicio — la autorización está **en dos capas**: la ruta y la
lógica de negocio.

### Roles (`enum Role` en `prisma/schema.prisma`)

| Rol | Quién es | Superficie principal |
|---|---|---|
| `OWNER` | Socio dueño de la organización | `/admin` (+ `/evaluador`) |
| `ADMIN` | Socio/staff administrador | `/admin` (+ `/evaluador`) |
| `EVALUATOR` | Evaluador de aspirantes | `/evaluador` |
| `WALKER` | Paseador certificado | `/walker` |
| `TUTOR` | Cliente, dueño del perro | `/tutor` |
| `APPLICANT` | Aspirante a paseador en capacitación | `/lms` |

Un mismo `User` puede tener varias memberships (ej.: un admin que también
cursa el LMS); se resuelve la primaria por escalafón de rol.

---

## 3. Roles en detalle: qué puede y qué NO puede hacer cada uno

### 3.1 OWNER / ADMIN (socios / staff)

En el código actual OWNER y ADMIN tienen los mismos permisos efectivos
(ambos pasan los mismos `requireRole(["OWNER", "ADMIN"])`).

**Puede:**

- **CRM de leads** (`/admin`): ver pipeline (NEW → QUALIFYING → QUALIFIED →
  INTERVIEW_SCHEDULED → WON / LOST / REJECTED), transicionar estados según la
  máquina de estados de `leads.ts` (descalificar exige `disqualifyReason`).
- **Entrevista de intake** (`/admin/leads/[id]/entrevista/nueva`): registrar la
  entrevista estructurada de 9 secciones (perfil del perro, salud,
  comportamiento, red flags, equipamiento). Resultado: APT /
  APT_WITH_CONDITIONS / PILOT_REQUIRED / NOT_APT.
- **Activar suscripción** (`activateSubscriptionFromIntake`): convierte una
  entrevista apta en Tutor + Dog + Subscription (`PENDING_PAYMENT`) +
  WalkAssignment, en una sola transacción. Registra la firma de los documentos
  legales (Anexo 2 — límites de servicio, privacidad, términos; Anexo 1 PPAA si
  el perro es PPAA) y marca el lead como WON.
- **Cobros** (`/admin/cobros`): registrar pago manual recibido
  (`markPaymentReceived`). Al primer pago la suscripción pasa a `ACTIVE` y se
  genera la ventana inicial de paseos (14 días).
- **Calendario** (`/admin/calendario`): ver todos los paseos en rango, con
  detección de solapamientos por walker; extender ventanas de generación de
  paseos; **reasignar walker** a un paseo programado.
- **Walkers** (`/admin/walkers`): ver y gestionar paseadores (estado,
  comisión, certificaciones, RUT).
- **Incidentes** (`/admin/incidentes`): ver incidentes abiertos, revisarlos y
  resolverlos con notas de operaciones.
- **Conciliación mensual** (`reconciliation.ts`): previsualizar y cerrar el mes
  por suscripción (paseos completados, cancelados, arrastre al mes siguiente).
- **Certificación**: todo lo que puede el EVALUATOR (ver 3.2).

**NO puede:**

- Iniciar ni completar un paseo: `startWalk` / `completeWalk` exigen rol
  WALKER y propiedad del paseo. El admin reasigna, no ejecuta.
- Cursar el LMS ni rendir quizzes, salvo que tenga además una membership
  APPLICANT.
- Saltarse las reglas de reasignación: el nuevo walker debe estar `ACTIVE`,
  con `Certification` `APPROVED` vigente, y si el perro es PPAA debe tener el
  add-on `PPAA_HANDLING`. El sistema lo rechaza aunque lo intente un OWNER.
- Activar una suscripción desde una entrevista `NOT_APT` o `PENDING`.
- Registrar un pago con monto distinto al del plan, ni duplicarlo: la
  idempotencia por `subscriptionId:billingPeriod:provider` lo impide.
- Acceder a datos de otra organización (todo filtra por `organizationId`).

### 3.2 EVALUATOR (evaluador de aspirantes)

**Puede:**

- Ver la lista de aspirantes listos para el gate (`/evaluador`): aquellos con
  **todas** las etapas previas en `PASSED`.
- **Programar el paseo supervisado** (`scheduleSupervisedWalk`).
- **Calificar el paseo supervisado** (`completeSupervisedWalk`) con resultado
  binario con matiz: `APT`, `APT_WITH_OBSERVATIONS` o `NOT_APT`.
  - Si apto: en una transacción se crea el `Walker`, la `Certification`
    (`APPROVED`, validez 12 meses, código `CRT-`), se activa la membership
    WALKER y se desactiva la de APPLICANT.
  - Si no apto: `Applicant.status = REJECTED`, `Enrollment.status = FAILED`.

**NO puede:**

- Calificar a un aspirante que no completó todas las etapas previas (el
  servicio lo valida; no hay override).
- Acceder al CRM, suscripciones, cobros, calendario ni incidentes.
- Ejecutar paseos, ni ver datos de tutores/perros fuera del contexto de la
  evaluación.
- Editar el contenido del curso ni los quizzes (no existe UI ni servicio de
  autoría; el curso se carga por seed).

> OWNER y ADMIN también pueden ejecutar las funciones de evaluador
> (`requireRole(["EVALUATOR", "OWNER", "ADMIN"])`).

### 3.3 WALKER (paseador certificado)

**Puede:**

- Ver su **agenda** (`/walker/agenda`): solo paseos asignados a él
  (filtro forzado `walkerId: ctx.walkerId`).
- Ver el **detalle de un paseo propio**: datos operativos del perro (raza,
  condiciones médicas, medicación, red flags, requisitos de equipamiento),
  contacto y dirección del tutor, y mapa si el plan es ELITE.
- **Iniciar el paseo** (`startWalk`): SCHEDULED → IN_PROGRESS, registra
  `actualStart`.
- **Completar el paseo** (`completeWalk`): exige reporte al tutor de mínimo
  10 caracteres; cierra en `COMPLETED` o `INCIDENT_OPEN`. El reporte se envía
  por email al tutor (best-effort: si falla el email, el cierre no se revierte
  y queda `reportError`).
- **Subir fotos** del paseo (Supabase Storage) y **puntos GPS** durante el
  paseo si el plan lo requiere (ELITE).
- **Reportar incidentes** (`reportIncidentAsWalker`): tipo (salud, fuga,
  agresión, mordida, tutor ausente, falla de equipo, etc.) y severidad. Si el
  paseo ya estaba completado, pasa a `INCIDENT_OPEN` para revisión de ops.

**NO puede:**

- Ver ni tocar paseos de otros walkers (la consulta misma lo excluye).
- Asignarse o reasignarse paseos; eso es exclusivo de OWNER/ADMIN.
- Cancelar paseos (las cancelaciones son del tutor o de operaciones).
- Resolver/cerrar incidentes: solo los reporta; los resuelve el admin.
- Ver datos comerciales: precios, pagos, suscripciones, pipeline de leads.
- Operar sin certificación vigente: la asignación a paseos exige Walker
  `ACTIVE` con `Certification` `APPROVED` vigente (invariante central del
  negocio), y pasear un perro PPAA exige el add-on `PPAA_HANDLING`.

### 3.4 TUTOR (cliente)

**Puede:**

- Ver su **dashboard** (`/tutor`): plan contratado, progreso mensual (paseos
  contratados vs. ejecutados), próximo paseo, últimos reportes.
- Ver sus **próximos paseos** y su **historial** (`/tutor/paseos`).
- Ver el **reporte de cada paseo** de sus perros: notas del walker, fotos
  (PLUS/ELITE) y recorrido GPS en mapa (ELITE).
- **Cancelar un paseo** propio, solo si falta más que la política de
  cancelación (`TUTOR_CANCEL_POLICY_HOURS`, ej. 24 h). La cancelación dentro
  del plazo cuenta como ejecutada en la conciliación (no genera arrastre).
- Recibir por email el reporte de cada paseo y el recordatorio 24 h antes.

**NO puede:**

- Ver paseos de perros que no son suyos (filtro por `dog.tutorId`).
- Cancelar un paseo fuera de plazo, ni paseos ya iniciados o completados.
- Elegir, cambiar o contactar-reasignar al walker: la asignación es de
  operaciones.
- Modificar su plan, pausar o cancelar la suscripción por autoservicio
  (durante el piloto eso lo gestiona el admin).
- Pagar en línea: durante el piloto el cobro es manual (transferencia) y lo
  registra el admin; la integración Flow.cl está diferida.
- Ver datos de otros tutores, del LMS, ni del CRM.

### 3.5 APPLICANT (aspirante a paseador)

**Puede:**

- Inscribirse automáticamente en el curso activo
  (`COURSE-PASEADOR-URBANO`) al entrar por primera vez al LMS: se crea el
  `Enrollment` y el progreso de etapas (la primera `IN_PROGRESS`, el resto
  `LOCKED`).
- Ver su **progreso** por etapas (1–9) y el contenido de cada etapa
  desbloqueada (lecciones de texto, video o link externo).
- **Rendir quizzes**: preguntas aleatorizadas desde el banco, snapshot
  inmutable del intento (sin respuestas correctas), calificación automática
  contra `passingScore`. Aprobar desbloquea la etapa siguiente.
- Reintentar un quiz reprobado **después del cooldown** configurado
  (`cooldownHours`).
- Marcar como completadas las etapas sin quiz (excepto el gate).

**NO puede:**

- Acceder a etapas bloqueadas ni saltarse el orden (gating secuencial
  estricto en `lms.ts`).
- Auto-aprobarse la etapa 9 (gate / paseo supervisado): solo el EVALUATOR la
  resuelve, y de forma presencial.
- Ver las respuestas correctas de los quizzes, ni reintentar antes del
  cooldown.
- Asignarse paseos ni aparecer como walker mientras no esté certificado: el
  `Walker` y su membership recién se crean cuando el evaluador lo aprueba.
- Acceder a ninguna otra superficie (admin, walker, tutor, evaluador).

### 3.6 Visitante anónimo (sin cuenta)

**Puede:**

- Ver la landing (`/`) con planes BASE/PLUS/ELITE y precios.
- **Enviar el formulario de contacto** (`captureLead`): única operación de
  escritura sin sesión. Crea un `Lead` (`LD-`) en la organización resuelta por
  slug, registrando aceptación de privacidad y términos con IP y user-agent
  (Ley 19.628).
- Leer `/privacidad`, `/terminos` y `/anexo-1-ppaa`.

**NO puede:** nada más. Toda otra ruta exige sesión y rol.

### Matriz resumen

| Acción | OWNER/ADMIN | EVALUATOR | WALKER | TUTOR | APPLICANT |
|---|:-:|:-:|:-:|:-:|:-:|
| Pipeline de leads / intake | ✓ | ✗ | ✗ | ✗ | ✗ |
| Activar suscripción / registrar pago | ✓ | ✗ | ✗ | ✗ | ✗ |
| Calendario global / reasignar walker | ✓ | ✗ | ✗ | ✗ | ✗ |
| Resolver incidentes / conciliación mensual | ✓ | ✗ | ✗ | ✗ | ✗ |
| Programar y calificar paseo supervisado | ✓ | ✓ | ✗ | ✗ | ✗ |
| Iniciar / completar paseo, fotos, GPS | ✗ | ✗ | ✓ | ✗ | ✗ |
| Reportar incidente en paseo | ✗ | ✗ | ✓ | ✗ | ✗ |
| Ver reportes / cancelar paseo propio | ✗ | ✗ | ✗ | ✓ | ✗ |
| Cursar LMS / rendir quizzes | ✗* | ✗ | ✗ | ✗ | ✓ |
| Enviar formulario de lead | — sin sesión, abierto a cualquiera — | | | | |

\* salvo membership APPLICANT adicional.

---

## 4. Modelo de datos (resumen)

Fuente de verdad: `prisma/schema.prisma`. Todos los modelos de negocio llevan
`organizationId`.

### Identidad y tenancy
- **Organization** (slug, legalName, RUT) · **User** (email único, passwordHash)
  · **Membership** (User ↔ Organization + Role, status ACTIVE/INACTIVE).

### LMS
- **Course** → **Stage** (1–9, `evaluationKind`: quiz V/F, selección múltiple,
  demostración práctica, escenario, role-play, checklist, y `SUPERVISED_WALK`
  para el gate) → **Lesson** / **Quiz** (passingScore, cooldown, randomize) →
  **Question** (banco, con `correctIds` y `weight`).
- **Enrollment** · **StageProgress** (LOCKED/IN_PROGRESS/PASSED/FAILED) ·
  **QuizAttempt** (snapshot de preguntas, score, passed).

### Personas
- **Applicant**: REGISTERED → IN_TRAINING → READY_FOR_GATE → CERTIFIED /
  REJECTED / WITHDRAWN.
- **Walker**: APPLICANT → IN_TRAINING → ACTIVE → ON_LEAVE / SUSPENDED /
  INACTIVE; `commissionRate`, RUT.
- **Certification** (`CRT-`): IN_PROGRESS → READY_FOR_GATE → APPROVED →
  EXPIRED / REVOKED; `validFrom/validUntil` (12 meses), `addOns[]` (ej.
  `PPAA_HANDLING`). **SupervisedWalk** (PENDING/APT/APT_WITH_OBSERVATIONS/NOT_APT).
- **Tutor** (RUT, `anonymizedAt` para derecho al olvido) · **Dog**
  (grupo racial, `isPPAA`, `requiresMuzzle`, aptitud, condiciones médicas,
  medicación, red flags, requisitos de equipo).

### CRM
- **Lead** (`LD-`, fuente, consentimientos con timestamp) ·
  **IntakeInterview** (`INT-`, payload JSON de 9 secciones, resultado,
  conteo de red flags, link a la suscripción resultante).

### Comercial y operación
- **Plan** (BASE/PLUS/ELITE: precio CLP, paseos/mes, duración, flags
  `requiresGpsTracking`, `requiresMediaCapture`, `includesInsurance`).
- **Subscription** (`SUB-`): PENDING_PAYMENT → ACTIVE → PAST_DUE / PAUSED /
  CANCELLED / EXPIRED; `billingDayOfMonth`, `pendingCarryOver`.
- **WalkAssignment** (recurrencia JSON walker↔perro) · **Walk** (`WLK-`):
  SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED_BY_TUTOR /
  CANCELLED_BY_OPS / MISSED / INCIDENT_OPEN; `isPilot` para el primer paseo
  evaluativo; notas = reporte al tutor.
- **WalkPhoto** · **WalkGpsPoint** (lat/lng/accuracy/speed, ELITE).
- **Incident** (`INC-`, tipo, severidad, OPEN → IN_REVIEW → RESOLVED /
  ESCALATED).
- **WalkerAvailability** / **WalkerUnavailability** (capacidad y bloqueos).
- **MonthlyReconciliation** (cierre mensual con arrastres).

### Dinero y legal
- **Payment**: idempotencyKey única `subscriptionId:billingPeriod:provider`;
  tipos SUBSCRIPTION_CHARGE / ONE_OFF / REFUND / WALKER_PAYOUT; campos
  preparados para boleta SII (`boletaNumber`, `boletaPdfUrl`).
- **LegalDocumentSigning**: firma versionada por documento (ética e higiene
  del walker, límites de servicio del tutor, adenda PPAA, privacidad,
  términos) con IP y user-agent; única por (usuario, documento, versión).
- **AuditLog**: acción, entidad, usuario (null en crons), metadata JSON.

---

## 5. Flujos de negocio principales

### Lead → Suscripción activa
1. Visitante envía el formulario → `Lead` NEW con consentimientos.
2. Admin califica en el pipeline → entrevista de intake estructurada.
3. Si APT / APT_WITH_CONDITIONS, el admin activa: en **una transacción** se
   crean User (con password temporal), Tutor, Dog, Subscription
   (`PENDING_PAYMENT`), WalkAssignment, y se registran las firmas legales.
   Lead → WON. Una entrevista produce como máximo una suscripción.
4. Admin registra el primer pago manual → Subscription `ACTIVE` + generación
   de la ventana inicial de paseos (14 días). El primer paseo es `isPilot`.

### Aspirante → Walker certificado
1. Aspirante se registra, entra al LMS, avanza etapas 1–8 (quizzes con
   cooldown, gating secuencial).
2. Con todo `PASSED` queda `READY_FOR_GATE` y aparece en `/evaluador`.
3. Evaluador programa y ejecuta el paseo supervisado; si apto, en una
   transacción nace el Walker `ACTIVE` con Certification vigente y se le
   activa el rol WALKER.

### Ejecución del paseo
1. Cron diario genera paseos `SCHEDULED` desde los WalkAssignments activos
   (idempotente por `scheduledStart`).
2. Walker inicia (GPS/fotos según plan), completa con reporte obligatorio.
3. El reporte llega al tutor por email; el tutor lo ve en su portal.
4. Incidente en cualquier punto → `INC-` para revisión y resolución de ops.
5. Fin de mes: conciliación por suscripción con arrastre de paseos
   cancelados por ops o perdidos (los cancelados por el tutor fuera de plazo
   no generan arrastre).

---

## 6. Servicios de backend (`src/server/services/`)

| Servicio | Responsabilidad |
|---|---|
| `leads.ts` | Captura pública, listado, máquina de estados del pipeline. |
| `intake.ts` | Registro de la entrevista de intake (payload zod de 9 secciones). |
| `subscriptions.ts` | Activación desde intake (transacción grande), pagos manuales idempotentes, listados admin. |
| `walks.ts` | Generación recurrente de paseos, inicio/cierre por walker, calendario admin, reasignación con validación de certificación y PPAA. |
| `certifications.ts` | Gate: lista de aspirantes listos, programación y resolución del paseo supervisado, creación de Walker + Certification. |
| `lms.ts` | Enrollment, progreso, quizzes (snapshot, cooldown, scoring, desbloqueo). |
| `incidents.ts` | Reporte por walker, revisión y resolución por admin. |
| `tutor-portal.ts` | Dashboard, paseos, cancelación con política horaria, progreso mensual. |
| `reconciliation.ts` | Vista previa y cierre mensual con arrastres. |
| `notifications.ts` / `reminders.ts` | Emails Resend: reporte de paseo, recordatorio 24 h al tutor, digest nocturno al walker. Best-effort. |
| `storage.ts` / `gps.ts` | Fotos del paseo (Supabase) y track GPS (ELITE). |
| `walkers-admin.ts` | Gestión administrativa de walkers. |
| `../audit.ts` | Helper `logAudit` — obligatorio en dinero, certificación y seguridad. |

Convenciones transversales:

- **Todo servicio recibe `AuthContext`** (excepto `captureLead` y los crons) y
  filtra por `organizationId`.
- **Transacciones atómicas** (`prisma.$transaction`) en operaciones
  compuestas: activación de suscripción, certificación, scoring de quiz,
  primer pago + generación de paseos.
- **Idempotencia** en pagos (idempotencyKey), generación de paseos
  (por `scheduledStart`), firmas legales (unique por versión) y certificación
  (una por enrollment).
- **AuditLog** en cada cambio de pago, certificación, suscripción, paseo,
  lead e incidente; `userId = null` cuando lo ejecuta un cron.

---

## 7. Jobs programados, integraciones y PWA

### Crons (Vercel, `vercel.json`, autenticados con `CRON_SECRET`)

| Endpoint | Horario (Santiago) | Qué hace |
|---|---|---|
| `/api/cron/extend-walks-window` | 01:00 | Genera paseos futuros para todas las suscripciones ACTIVE. |
| `/api/cron/send-tutor-reminders` | 18:00 | Recordatorio al tutor de los paseos de mañana. |
| `/api/cron/walker-nightly-digest` | 20:00 | Digest al walker con su agenda de mañana. |

Los crons reportan fallos a Sentry y se auditan sin usuario.

### Integraciones

- **Resend** — emails transaccionales (pendiente verificar dominio propio).
- **Supabase Storage** — fotos de paseo (`WalkPhoto.storageKey`).
- **Flow.cl** — **diferido**: el modelo de `Payment` ya soporta provider
  `flow`, pero durante el piloto el cobro es manual (`transfer_manual`).
- **Boletas SII** — **diferido**: campos `boletaNumber`/`boletaPdfUrl`
  reservados; emisión manual durante el piloto.

### PWA

App del walker y portal del tutor son mobile-first con página `/offline` de
fallback. Service worker y manifest: registro vía `PwaRegister` en el layout;
push notifications (ticket #54) pendientes.

---

## 8. Cumplimiento y seguridad

- **Ley 19.628 / 21.719 (datos personales)**: consentimiento explícito en la
  captura de lead (timestamp + IP + user-agent); `Tutor.anonymizedAt` para
  anonimización; firma versionada de la política de privacidad.
- **Ley 21.020 (tenencia responsable)**: Anexo 2 (límites del servicio)
  firmado al activar toda suscripción; Anexo 1 (adenda PPAA) obligatorio si el
  perro es PPAA; flags `isPPAA` y `requiresMuzzle` en Dog; solo walkers con
  add-on `PPAA_HANDLING` pueden pasear perros PPAA (validado también en
  reasignaciones).
- **Trazabilidad ELITE**: GPS + fotos + reporte son parte del contrato del
  plan (`requiresGpsTracking`, `requiresMediaCapture` en Plan).
- **Aislamiento multi-tenant**: filtro por `organizationId` en todos los
  servicios; `TenantViolationError` si falta membership.
- **Auditoría**: `AuditLog` indexado por organización y fecha; permite
  reconstruir meses después qué pasó con cada cobro, certificación y paseo.

---

## 9. Invariantes no negociables (tal como están aplicadas en código)

1. Un Walker solo opera con **certificación `APPROVED` vigente**; las
   asignaciones y reasignaciones lo validan, sin override.
2. Perro PPAA ⇒ walker con add-on `PPAA_HANDLING` + Anexo 1 firmado.
3. El **gate de certificación es binario y presencial**: ningún rol puede
   auto-aprobar la etapa 9; solo `completeSupervisedWalk` la resuelve.
4. **Pagos idempotentes**: un período de facturación no puede cobrarse dos
   veces por el mismo proveedor.
5. **Operaciones compuestas = una transacción**: activación de suscripción,
   certificación, scoring de quiz.
6. **Nada se borra**: estados terminales + auditoría.
7. **Cada rol ve solo lo suyo**: walker sus paseos, tutor sus perros,
   aspirante su enrollment; admin ve todo, pero solo de su organización.

---

## 10. Estado actual y pendientes conocidos

- **En producción (piloto)**: labradog.vercel.app (deploy por Vercel CLI).
- **Diferidos deliberadamente**: cobro online Flow.cl (#58), boletas SII
  (#59) — cobro y boleta manuales durante el piloto.
- **Backlog conocido**: Web Push (#54), onboarding (#65), comisiones del
  walker (#66), recertificación/expiración (#68), CI (#72).
- **Decisiones pendientes**: PWA pura vs. Expo para GPS en background;
  WhatsApp API oficial vs. intermediario.
