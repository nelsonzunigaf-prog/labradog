---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-06-06'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-labradog-2026-06-06/prd.md
  - _bmad-output/planning-artifacts/architecture.md
partyModeReview: "2026-06-06 — Amelia (sizing/deps/ACs), Winston (esquema antes que lógica), Sally (UX de calle) — cambios aplicados"
---

# labradog - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for labradog, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

**Revisión party-mode aplicada:** decisiones de esquema adelantadas a Epic 1 (snapshot económico, `version`, event_log writer, R2, TZ/feriados, máquina de estados); stories 3.1, 4.2 y 5.1 originales particionadas; ACs precisados; ajustes UX de calle integrados (checklist en 2 niveles, registro de un toque, incidente captura-primero, feedback de sincronización, reporte generado local).

## Requirements Inventory

### Functional Requirements

FR-001: Login con email/contraseña + recuperación de contraseña
FR-002: Dos roles (admin, paseador); cuentas creadas por admins, sin auto-registro
FR-003: Multi-admin con permisos plenos e idénticos
FR-004: Fichas de tutor (contacto, dirección, acuerdo comercial con plan default y modalidad de cobro, estado); plan efectivo vive en el paseo
FR-005: Entrevista inicial estructurada + red flags en ficha tutor; 2+ red flags → sugerir evaluar rechazo
FR-006: Registro de aceptación de anexos legales (fecha y medio; sin firma electrónica en v1)
FR-007: Fichas de perro (perfil completo: raza, grupo operativo, temperamento, equipamiento, premios, notas)
FR-008: Compatibilidad entre perros del mismo tutor (habilita paseos de hasta 3)
FR-009: Historial visible por perro (paseos, incidentes, evolución emocional)
FR-010: Programa de capacitación: 9 etapas + módulo razas, contenido navegable (desde docs Word)
FR-011: Desbloqueo secuencial de etapas; razas después de etapa 9
FR-012: Tests selección múltiple autocorregibles (etapas 1,2,3,5); 80% mínimo, intentos ilimitados con feedback
FR-013: Examen final: 30 preguntas aleatorias del banco de 100; 80% para aprobar
FR-014: Evaluaciones prácticas (etapas 4-8) aprobadas por admin con veredicto/observaciones/fecha
FR-015: Plantillas de evaluación disponibles como pauta del evaluador
FR-016: Certificación al completar todo; habilita recibir paseos
FR-017: Gate duro: no certificado = sin paseos; estado transición "habilitado en certificación" 30 días (vence → no recibe nuevos)
FR-018: Tablero admin de avance de capacitación
FR-019: Recurrencias fijas por perro (días+hora+bloque 1-2hrs+plan+paseador); generan paseos semanales; bloque determina precio
FR-020: Paseos puntuales no recurrentes
FR-021: Cancelar (con quién/cuándo) / reagendar / reasignar paseos
FR-022: Cancelación mismo día = cobrable por defecto con override; suma al cobrable, sin comisión por defecto
FR-023: Validaciones al asignar: certificación, sin tope horario, ratio 1-2 perros (3 mismo tutor compatibles)
FR-024: Vista agenda paseador (diaria/semanal con datos del perro)
FR-025: Vista agenda global admin (estados, cobertura, huecos)
FR-026: Checklist pre-paseo obligatoria; bloquea transición a "en curso"
FR-027: Checklist asociada al paseo con hora de completado
FR-028: Registro post-paseo (duración real, estado emocional, pipí/caca, hidratación, conductas, ajustes)
FR-029: Incidentes tipificados (escape/pelea/mordida/lesión/pánico) con notificación inmediata a admins
FR-030: 1-2 fotos adjuntas al registro (plan PLUS)
FR-031: Reporte para tutor generado por plan (BASE/PLUS/ELITE), listo para copiar a WhatsApp
FR-032: Reportes visibles para admins con historial por perro/tutor/paseador y estado de envío
FR-033: Modalidad de cobro por tutor: por paseo/semanal/mensual × prepago/postpago
FR-034: Precio = plan × bloque, congelado al paseo; cobrable = completados + cancelados-cobrables (+ contratado si prepago)
FR-035: Registro de pagos (transferencia) contra cobrable; estado de cuenta por tutor
FR-036: % comisión por paseador (60-80) configurable; default por nivel 60/70/80 (ratificado por socios); % fijado por paseo al completarse
FR-037: Liquidaciones por período con detalle, estados (borrador/aprobada/pagada) y registro de pago
FR-038: Paseador ve sus comisiones e historial de liquidaciones
FR-039: Ficha del paseador (contacto, certificación, % comisión, especialidades de caminata, notas)
FR-040: Saldo prepago: contratado vs consumido, alerta de agotamiento
FR-041: Notificaciones email: resumen matinal al paseador + transaccional ante asignación/reasignación/cancelación + email a admins por incidente (agregado 06-06-2026 por decisión de Nelson)

### NonFunctional Requirements

NFR-01: Interfaz 100% español (Chile); flujos del paseador completables en móvil en < 2 min
NFR-02: Responsive móvil-primero para paseador; admin desktop-primero pero funcional en móvil
NFR-03: Datos personales conforme Ley 19.628 (minimización, sin terceros)
NFR-04: Auditabilidad: autor + timestamp en toda escritura relevante
NFR-05: Respaldo diario automático (Neon)
NFR-06: Infraestructura < $20 USD/mes (real: ~$5-7)
NFR-07: Mantenibilidad IA-first: stack mainstream, monolito, guardarraíles (project-context.md, seeds, tests)

### Additional Requirements

- **Starter template (Epic 1 Story 1):** `npx create-next-app@latest labradog-app --yes` + `npm install drizzle-orm better-auth` — stack: Next.js 16, TS, Tailwind, shadcn/ui, Drizzle, Neon, Better Auth, R2, Railway
- Patrón de auditoría: columnas `created_by/at`, `updated_by/at` en todas las tablas + `event_log` para operaciones sensibles, con **writer tipado** definido en Epic 1
- **Decisiones de esquema adelantadas a Epic 1** (revisión Winston): columnas de snapshot económico (`precio_clp_snapshot`, `comision_pct_snapshot`) en la tabla `paseos` desde su creación; columna `version` (bloqueo optimista) en toda entidad editable por multi-admin
- Motores puros en `lib/engine/` (recurrencia, cobros, certificacion, reportes, paseo-estados) con tests unitarios co-ubicados; **las reglas de negocio viven en el Engine, nunca en la Action ni el componente** — el patrón se blinda en la primera story que toque un motor (2.2)
- Materialización idempotente de paseos recurrentes (horizonte 14 días, **unique constraint** recurrencia_id+fecha_local en BD, TZ America/Santiago por ocurrencia); las excepciones manuales **anclan** el paseo contra re-materialización
- Cola offline local (checklist + registro) con contrato de evento que incluye timestamp de origen del dispositivo; validación de orden de eventos en servidor; **feedback de sincronización siempre visible**
- Seed one-shot del contenido de capacitación desde documentos Word (`scripts/seed-capacitacion.ts`)
- Dinero en enteros CLP; fechas UTC en BD, render America/Santiago; utilidad central de fechas/TZ + feriados CL
- Dominio en español en código y BD (paseos, no walks); convenciones de naming documentadas
- CI: GitHub Actions (lint + test por PR); deploy auto Railway; Sentry free tier
- Email: Resend (free tier) aislado en `lib/email.ts`; cron diario Railway 7:00 para resumen matinal (idempotente); transaccionales desde actions de agenda e incidentes
- E2E Playwright: checklist-bloqueante, certificacion-gate, liquidacion
- `project-context.md` para agentes IA como entregable del Epic 1

### UX Design Requirements

(No existe documento UX — herramienta interna de 2 roles; diseño con shadcn/ui, móvil-primero para paseador. Principios de calle incorporados por revisión party-mode/Sally: interacciones de un toque con zonas táctiles ≥48px en flujos del paseador, teclado solo si el usuario lo invoca, notas críticas del perro sin scroll, direcciones con tap a Maps, captura-primero-narra-después en incidentes, indicador de sincronización persistente.)

### FR Coverage Map

| FRs | Épica |
|---|---|
| FR-001, 002, 003 | Epic 1 — acceso y roles |
| FR-004, 005, 006 | Epic 1 — ficha tutor (entrevista, red flags, anexos) |
| FR-007, 008, 009 | Epic 1 — ficha perro (perfil, compatibilidad, historial) |
| FR-039 | Epic 1 — ficha paseador |
| FR-010, 011 | Epic 2 — contenido y desbloqueo de etapas |
| FR-012, 013 | Epic 2 — tests y examen final |
| FR-014, 015 | Epic 2 — evaluaciones prácticas |
| FR-016, 017, 018 | Epic 2 — certificación, gate y tablero |
| FR-019, 020 | Epic 3 — recurrencias, materialización y paseos puntuales |
| FR-021, 022, 023 | Epic 3 — excepciones y validaciones |
| FR-024, 025 | Epic 3 — vistas paseador/admin |
| FR-041 | Epic 3 — notificaciones email |
| FR-026, 027 | Epic 4 — checklist bloqueante |
| FR-028, 029, 030 | Epic 4 — registro, incidentes, fotos |
| FR-031, 032 | Epic 4 — reportes |
| FR-033, 034, 035 | Epic 5 — modalidades, cobrable, pagos |
| FR-040 | Epic 5 — saldo prepago |
| FR-036, 037, 038 | Epic 5 — comisiones y liquidaciones |

Cobertura: **41/41 FRs** — sin huérfanos.

## Epic List

### Epic 1: Operación registrada — acceso, fundaciones y fichas
El equipo entra con su rol, las fundaciones técnicas transversales quedan establecidas (auditoría, almacenamiento, fechas, máquina de estados, esquema económico), y los admins registran toda la cartera: tutores, perros y paseadores. La base de datos viva del negocio reemplaza la planilla.
**FRs covered:** FR-001–FR-009, FR-039 · 7 stories

### Epic 2: Paseadores certificados — capacitación
Los paseadores estudian las 9 etapas + módulo razas desde el celular, rinden tests autocorregibles y el examen del banco de 100; los admins registran evaluaciones prácticas y monitorean avance; el sistema otorga la certificación que habilita a pasear (gate duro).
**FRs covered:** FR-010–FR-018 · 7 stories

### Epic 3: Agenda viva — recurrencias, asignaciones y notificaciones
Recurrencias fijas generan los paseos semanales solos (materialización idempotente, TZ Chile, snapshot de precio al nacer); cancelar/reagendar/reasignar con validaciones del método; cada paseador ve su día con avisos de cambios; emails automáticos.
**FRs covered:** FR-019–FR-025, FR-041 · 7 stories

### Epic 4: El método en la calle — checklist, registro y reportes
Flujo completo del paseo en el celular, diseñado para una mano, sol y sin señal: checklist en dos niveles, cola offline con feedback visible, registro de un toque, incidentes captura-primero, reporte generado localmente.
**FRs covered:** FR-026–FR-032 · 6 stories

### Epic 5: Cobros claros — modalidades, pagos y liquidaciones
El ciclo económico completo leyendo snapshots (nunca recalculando): cobrable por modalidad, pagos, saldos prepago, liquidaciones de comisiones con la misma verdad para admin y paseador.
**FRs covered:** FR-033–FR-038, FR-040 · 5 stories

## Epic 1: Operación registrada — acceso, fundaciones y fichas

Los admins y paseadores acceden con su rol, las fundaciones transversales quedan establecidas y la cartera completa del negocio vive en la plataforma.

### Story 1.1: Scaffold del proyecto y pipeline

As a admin (Nelson),
I want el proyecto inicializado con el stack decidido, desplegado y con CI funcionando,
So that toda story posterior se construye sobre una base estable, auditable y desplegable.

**Acceptance Criteria:**

**Given** la arquitectura aprobada
**When** se ejecuta el scaffold (`create-next-app` + Drizzle + Better Auth + shadcn/ui)
**Then** la app corre local y desplegada en Railway con healthcheck OK
**And** GitHub Actions corre lint + tests en cada PR; Sentry conectado
**And** existen `project-context.md` (convenciones para agentes IA) y el **wrapper estándar de Server Action** (validación Zod + verificación de rol + resultado tipado `{ok,data|error}`) que toda action posterior usará
**And** el patrón de auditoría queda implementado: helper de columnas `*_by/*_at` + tabla `event_log` con **writer tipado** (`registrarEvento(tipo, entidad, payload, actor)`) y tests
**And** las decisiones de esquema transversales quedan documentadas en `project-context.md`: columnas de snapshot económico en `paseos`, columna `version` en entidades editables, soft-delete vía estado (no DELETE físico)

### Story 1.2: Login con roles

As a miembro del equipo (admin o paseador),
I want iniciar sesión con email y contraseña y llegar a mi área según mi rol,
So that cada uno ve solo lo que le corresponde.

**Acceptance Criteria:**

**Given** una cuenta existente con rol asignado
**When** inicio sesión con credenciales válidas
**Then** llego a `/admin` o `/paseador` según mi rol, y el middleware me impide acceder al área del otro rol
**Given** que olvidé mi contraseña
**When** solicito recuperación
**Then** recibo email con enlace de restablecimiento funcional (vía `lib/email.ts` / Resend)
**And** no existe auto-registro: ninguna ruta pública permite crear cuentas (FR-002)

### Story 1.3: Gestión de cuentas del equipo

As a admin,
I want crear, activar y desactivar cuentas de admins y paseadores,
So that controlo quién accede a la plataforma (multi-admin con permisos idénticos).

**Acceptance Criteria:**

**Given** soy admin
**When** creo una cuenta con email, nombre y rol
**Then** la persona puede iniciar sesión (enlace de invitación) y aparece en el listado del equipo
**When** desactivo una cuenta
**Then** esa persona no puede iniciar sesión y sus datos históricos permanecen intactos (soft-delete vía estado)
**And** toda creación/desactivación queda en `event_log` con autor y fecha

### Story 1.4: Fundaciones transversales — almacenamiento, fechas y estados del paseo

As a desarrollador IA de las épicas siguientes,
I want los módulos transversales que múltiples stories consumen, definidos una sola vez,
So that las épicas 3-5 no descubren dependencias ni migraciones a mitad de implementación.

**Acceptance Criteria:**

**Given** el scaffold de 1.1
**When** se implementa `lib/storage.ts`
**Then** existe helper de subida a R2 con **compresión en cliente** (target: JPEG/WebP, lado mayor ≤1600px, ≤400KB) y reintento ante fallo de red, con test
**When** se implementa `lib/fechas.ts`
**Then** existe utilidad central TZ America/Santiago (conversión UTC↔local por fecha, inmune a DST) + tabla/lista de feriados CL, con tests de los 2 cambios de hora anuales
**When** se implementa `lib/engine/paseo-estados.ts`
**Then** la **máquina de estados del paseo** es un artefacto único: estados (pendiente → checklist_completa → en_curso → completado | cancelado) y transiciones permitidas con guardas, exportada para que 3.x/4.x/5.x la consuman — con tests que rechazan toda transición inválida
**And** la tabla `paseos` se crea aquí con: snapshot económico (`precio_clp_snapshot`, `comision_pct_snapshot`, nullable hasta poblarse en 3.2/4.x), `version` para lock optimista, columnas de auditoría y unique constraint `(recurrencia_id, fecha_local)`

### Story 1.5: Ficha del tutor con entrevista inicial y anexos

As a admin,
I want registrar tutores con su entrevista inicial, red flags y anexos legales,
So that el filtro profesional del método queda documentado desde el primer contacto.

**Acceptance Criteria:**

**Given** un tutor nuevo
**When** completo su ficha (contacto, dirección de retiro, acuerdo comercial: plan default + modalidad de cobro, estado)
**Then** queda guardada y editable, con auditoría y `version`
**When** registro la entrevista inicial (historial del perro, reactividad, escapes, equipamiento, expectativas) y marco red flags de la taxonomía del método
**Then** con 2+ red flags el sistema muestra alerta "evaluar rechazo del servicio" (regla en `lib/engine/fichas.ts`) (FR-005)
**When** registro la aceptación de los anexos legales con fecha y medio, adjuntando PDF escaneado opcional (helper de 1.4)
**Then** quedan visibles en la ficha (FR-006)

### Story 1.6: Ficha del perro con compatibilidades e historial

As a admin,
I want registrar los perros de cada tutor con el perfil del método y sus compatibilidades,
So that cada paseo se planifica con la información que el método exige.

**Acceptance Criteria:**

**Given** un tutor con ficha
**When** agrego un perro (nombre, foto — helper 1.4, raza, grupo operativo, edad, talla, condición física, temperamento, equipamiento, premios aceptados, notas de manejo con marca de "crítica")
**Then** el perfil queda completo y visible (FR-007)
**When** marco compatibilidad entre dos perros del mismo tutor
**Then** la relación queda registrada en ambos sentidos (tabla `perro_compatibilidades`) y habilitará paseos de hasta 3 (FR-008)
**And** el perfil incluye sección de historial (paseos, incidentes, evolución emocional) que muestra los datos existentes y estados vacíos mientras no haya paseos (FR-009)

### Story 1.7: Ficha del paseador

As a admin,
I want registrar paseadores con sus especialidades y % de comisión,
So that la asignación de paseos y la liquidación usan datos oficiales.

**Acceptance Criteria:**

**Given** una cuenta de paseador creada (Story 1.3)
**When** completo su ficha (contacto, especialidades de caminata: energética/senior/olfatoria, % comisión, notas)
**Then** queda guardada con auditoría y visible su estado de certificación ("sin certificar" hasta Epic 2)
**And** el % de comisión solo acepta enteros entre 60 y 80 (FR-036/039)

## Epic 2: Paseadores certificados — capacitación

Los paseadores completan el programa de 9 etapas + módulo razas desde el celular y el sistema otorga la certificación que habilita a pasear.

### Story 2.1: Seed del contenido de capacitación

As a admin,
I want las 9 etapas, el módulo de razas, los tests y el banco de 100 preguntas cargados desde los documentos existentes,
So that el programa completo vive en la plataforma sin transcripción manual.

**Acceptance Criteria:**

**Given** los documentos Word de `archivos del proyecto\`
**When** corre `scripts/seed-capacitacion.ts`
**Then** existen las 9 etapas + módulo razas con su contenido navegable, los tests de etapas 1/2/3/5 con sus preguntas y alternativas, y el banco de 100 preguntas del examen
**And** el seed es idempotente (re-ejecutar produce 0 filas nuevas) y reporta qué cargó

### Story 2.2: Navegación de etapas con desbloqueo secuencial

As a paseador,
I want estudiar el contenido de mi etapa actual desde el celular y ver mi avance,
So that me capacito a mi ritmo sin saltarme la secuencia del método.

**Acceptance Criteria:**

**Given** un paseador en capacitación
**When** entro a "Mi capacitación"
**Then** veo las etapas con estado (aprobada / actual / bloqueada) y solo puedo abrir contenido hasta mi etapa actual; el módulo de razas se desbloquea al aprobar la etapa 9 (FR-011)
**And** la regla de desbloqueo vive en `lib/engine/certificacion.ts` (NUNCA en la Action ni el componente) — **esta story define el patrón Engine para todas las reglas posteriores**, con test que verifica que la Action delega al motor
**And** la lectura es cómoda en móvil (NFR-02)

### Story 2.3: Tests de etapa autocorregibles

As a paseador,
I want rendir el test de mi etapa y saber al instante si aprobé,
So that avanzo sin depender de que un admin corrija.

**Acceptance Criteria:**

**Given** estoy en una etapa con test (1, 2, 3 o 5)
**When** respondo y envío
**Then** veo mi puntaje al instante con feedback por pregunta; puntaje = correctas/total **sin redondeo**: aprueba si ≥ 0.80 exacto (24/30 aprueba; 23/29 = 79.3% no aprueba) (FR-012)
**Given** que no aprobé
**When** reintento
**Then** sin límite de intentos; cada intento queda registrado (fecha, puntaje, respuestas)
**And** esta story define el **contrato de selección aleatoria con seed persistida** (PRNG determinista sembrado por rendición) que 2.5 reutilizará — documentado en `project-context.md`

### Story 2.4: Evaluaciones prácticas registradas por admin

As a admin evaluador,
I want registrar el veredicto de las etapas prácticas con la pauta del método a la vista,
So that la evaluación presencial queda trazable y estandarizada.

**Acceptance Criteria:**

**Given** un paseador en etapa práctica (4, 5 práctica, 6, 7 u 8)
**When** abro su evaluación pendiente
**Then** veo la pauta correspondiente (casos etapa 6, plantilla etapa 7, checklist etapa 8) como guía (FR-015)
**When** registro veredicto (aprobado / repetir) con observaciones
**Then** queda con mi autoría y fecha en `event_log`; "aprobado" desbloquea la siguiente etapa (vía motor), "repetir" mantiene la etapa con feedback visible para el paseador (FR-014)

### Story 2.5: Examen final desde el banco de preguntas

As a paseador,
I want rendir el examen final con preguntas aleatorias del banco,
So that demuestro dominio integral del método.

**Acceptance Criteria:**

**Given** aprobé las etapas 1-8
**When** inicio el examen final
**Then** recibo 30 preguntas del banco de 100 seleccionadas con el contrato de seed de 2.3 (auditable: la misma seed reproduce la misma selección) (FR-013)
**When** envío con ≥80% (regla de 2.3)
**Then** la etapa 9 queda aprobada; si no, reintento con nueva selección aleatoria

### Story 2.6: Certificación y gate de asignación

As a admin,
I want que el sistema certifique automáticamente al completar todo y bloquee asignaciones a no certificados,
So that la regla dura del negocio se cumple sin excepciones manuales.

**Acceptance Criteria:**

**Given** un paseador con 9 etapas + módulo razas aprobados
**When** se completa el último requisito
**Then** el sistema otorga "Paseador de Perros Profesional - Entorno Urbano" con fecha y evaluadores; su ficha pasa a "certificado" (FR-016)
**And** la certificación exige además que la **última evaluación práctica presencial esté aprobada** — el certificado nunca sale solo con el examen teórico (regla en `lib/engine/certificacion.ts`; captura el espíritu del "paseo supervisado" del doc de visión sin un hito 10 separado — addendum architecture.md 12-06-2026)
**Given** un paseador no certificado
**When** alguien intenta asignarle un paseo
**Then** `lib/engine/certificacion.ts` lo rechaza con mensaje claro (FR-017)
**Given** un paseador marcado "habilitado en certificación" por un admin
**When** pasan **30 días calendario desde la activación del estado** (evento registrado en `event_log`)
**Then** deja de poder recibir paseos nuevos (los ya asignados se reasignan); el tablero alerta 5 días antes del vencimiento

### Story 2.7: Tablero de avance de capacitación

As a admin,
I want ver el avance de todos los paseadores en programa y mis evaluaciones pendientes,
So that gestiono el cuello de botella del escalamiento (3-4 certificados para 30 tutores).

**Acceptance Criteria:**

**Given** paseadores en capacitación
**When** abro el tablero de capacitación
**Then** veo por paseador: etapa actual, % de avance, última actividad, evaluaciones prácticas pendientes de registrar y vencimientos próximos del estado de transición (FR-018)

### Story 2.8: App shell y rediseño Menta & Mar

> ⚠️ **Orden de ejecución:** esta story se ejecuta ANTES de la 2.3 (insertada por sprint-change-proposal-2026-06-12; las stories restantes nacen sobre el shell nuevo). Numerada 2.8 para no renumerar referencias existentes.

As a usuario de Labradog (admin o paseador),
I want que toda la plataforma tenga la identidad Menta & Mar y navegación consistente,
So that la herramienta refleja el cuidado de la marca y nunca quedo atrapado en una pantalla.

**Acceptance Criteria:**

**Given** los contratos `DESIGN.md` y `EXPERIENCE.md` (`ux-designs/ux-labradog-2026-06-12/`)
**When** se aplica el tema vía variables shadcn en globals.css
**Then** todos los tokens de DESIGN.md quedan mapeados (--primary menta, --secondary mar, radius, etc.) y NINGUNA página usa colores/radios ad-hoc; el contraste cumple AA (tinta #1F3833 sobre menta — jamás blanco sobre menta)

**And** existe el app shell de EXPERIENCE.md: layout del paseador con bottom-nav fija (Mi día 🐾 / Mi capacitación 🎓) y layout del admin con nav horizontal (Equipo · Tutores · Perros · Paseadores) + breadcrumb en páginas de detalle

**And** TODA pantalla no-raíz tiene "← volver" arriba a la izquierda, en la misma posición

**And** las pantallas existentes quedan retrofiteadas (portada, login, forgot/reset, admin home/equipo/tutores/tutores-[id]/perros-[id]/paseadores/paseadores-[userId], paseador home/mi-capacitacion/mi-capacitacion-[slug]) SIN cambios de comportamiento: misma data, mismas reglas, mismos flujos

**And** las listas existentes muestran los estados vacío/carga según EXPERIENCE.md

**And** regresión completa verde: lint + unit + build + los 14 E2E (ajustando selectores solo si cambió texto visible)

## Epic 3: Agenda viva — recurrencias, asignaciones y notificaciones

La agenda mental se vuelve sistema: recurrencias que generan paseos solas, excepciones controladas y avisos automáticos.

### Story 3.1: Motor de recurrencia

As a admin,
I want configurar la recurrencia fija de cada perro con el cálculo de ocurrencias correcto y probado,
So that la generación de paseos es confiable incluso con cambios de hora y feriados.

**Acceptance Criteria:**

**Given** un perro con tutor activo y un paseador certificado
**When** creo una recurrencia (días de semana + hora + bloque 1 o 2 hrs + plan + paseador)
**Then** queda guardada con validaciones (paseador certificado vía motor 2.6) (FR-019)
**And** `lib/engine/recurrencia.ts` (puro) calcula las ocurrencias de un rango de fechas usando `lib/fechas.ts`: tests cubren los 2 cambios de hora anuales (el paseo de las 10:00 sigue a las 10:00 hora local) y semanas con feriados CL
**And** editar/pausar la recurrencia afecta solo ocurrencias futuras

### Story 3.2: Materialización idempotente de paseos

As a admin,
I want que los paseos de las próximas 2 semanas existan solos, sin duplicados,
So that la agenda se mantiene sin intervención manual.

**Acceptance Criteria:**

**Given** recurrencias activas
**When** se consulta la agenda (o corre el cron)
**Then** se materializan los paseos faltantes con horizonte de 14 días, escribiendo el **snapshot de precio** (`precio_clp_snapshot` = tarifa vigente plan × bloque) al nacer cada paseo
**And** idempotencia verificable: **re-ejecutar la materialización N veces produce 0 filas nuevas** (la unique constraint de 1.4 lo garantiza incluso ante ejecuciones concurrentes)
**Given** un paseo modificado manualmente (cancelado, reagendado, reasignado)
**When** la materialización vuelve a correr
**Then** el paseo modificado queda **anclado**: la re-materialización nunca lo pisa ni lo duplica

### Story 3.3: Paseos puntuales

As a admin,
I want agendar paseos sueltos fuera de la recurrencia,
So that atiendo casos a demanda sin forzar el modelo.

**Acceptance Criteria:**

**Given** un perro y un paseador certificado
**When** creo un paseo puntual (fecha, hora, bloque, plan, paseador)
**Then** aparece en ambas agendas con las mismas validaciones y el mismo snapshot de precio que un paseo recurrente (FR-020)

### Story 3.4: Cancelar, reagendar y reasignar con validaciones

As a admin,
I want gestionar excepciones de agenda con las reglas del método aplicadas por el sistema,
So that ningún cambio rompe las invariantes (certificación, topes, ratio).

**Acceptance Criteria:**

**Given** un paseo pendiente
**When** lo cancelo indicando quién canceló (tutor / Labradog)
**Then** queda cancelado con autoría; si es del tutor el mismo día, se marca "cobrable" por defecto con override disponible (FR-021/022)
**When** lo reasigno a otro paseador
**Then** el sistema valida vía motores: certificación vigente (incl. vencimiento transición), sin tope horario, ratio 1-2 perros (3 del mismo tutor solo si compatibles) (FR-023)
**Given** dos admins editando el mismo paseo
**When** el segundo guarda sobre una `version` obsoleta
**Then** recibe "este paseo cambió, recarga" y no hay doble asignación silenciosa

### Story 3.5: Mi agenda (paseador)

As a paseador,
I want ver mi día y mi semana con todo lo que necesito para cada paseo,
So that opero desde el celular sin preguntar nada por WhatsApp.

**Acceptance Criteria:**

**Given** paseos asignados a mí
**When** abro "Mi día"
**Then** veo mis paseos ordenados con: perro (foto, temperamento), hora, bloque y plan; las **notas de manejo críticas visibles sin scroll** (arriba de todo) (FR-024)
**And** la dirección de retiro es un **tap directo a Google Maps/Waze**, no texto a copiar
**Given** que un admin cambió un paseo mío hoy después del email matinal
**When** abro la app
**Then** veo un **banner destacado** con los cambios del día (complemento del email — los cambios de último minuto no viven solo en correo)
**And** vista semanal con carga y huecos; todo usable con una mano (zonas táctiles ≥48px) (NFR-01/02)

### Story 3.6: Agenda global (admin)

As a admin,
I want la vista global de paseos por día y semana con estados y cobertura,
So that detecto huecos y reasigno antes de que sean problema.

**Acceptance Criteria:**

**Given** paseos materializados
**When** abro la agenda global
**Then** veo por día/semana todos los paseos con estado, paseador asignado y huecos por cancelaciones resaltados (FR-025)
**And** puedo filtrar por paseador, tutor y estado

### Story 3.7: Notificaciones por email

As a paseador,
I want recibir cada mañana mis paseos del día y avisos inmediatos si algo cambia,
So that nunca llego tarde ni me presento a un paseo cancelado.

**Acceptance Criteria:**

**Given** paseos asignados para hoy
**When** corre el cron diario (7:00 America/Santiago, vía ruta protegida invocada por Railway cron)
**Then** recibo email "Tus paseos de hoy" con: perro, hora, dirección, plan y notas críticas — y el envío es **idempotente**: se marca cada notificación enviada en BD y re-ejecutar el cron produce 0 emails duplicados (FR-041)
**Given** un cambio en un paseo mío (asignación, reasignación, cancelación)
**When** un admin lo guarda
**Then** recibo email inmediato con el detalle (y el banner de 3.5 lo refleja al abrir la app)
**And** los emails salen vía `lib/email.ts` (Resend), en español, texto simple legible en móvil

## Epic 4: El método en la calle — checklist, registro y reportes

El flujo completo del paseo en el celular del paseador — diseñado para una mano, sol y sin señal.

### Story 4.1: Checklist pre-paseo bloqueante

As a paseador,
I want completar la checklist del método antes de iniciar, rápido pero sin trampa,
So that el estándar se cumple en cada paseo sin que el sistema me empuje a mentir.

**Acceptance Criteria:**

**Given** un paseo pendiente asignado a mí, hoy
**When** lo abro
**Then** veo la checklist en **dos niveles**: los 3 ítems de seguridad irreversible (ajuste dos dedos, equipo/correa funcional, contacto tutor disponible) como taps obligatorios individuales, y el resto (clima, teléfono, premios, agua) como un toggle "todo listo" que **desmarco** si algo falta — zonas táctiles ≥48px (FR-026)
**When** completo e inicio
**Then** el paseo transiciona vía `lib/engine/paseo-estados.ts` (pendiente → checklist_completa → en_curso) y la checklist queda asociada con hora de completado (FR-027)
**And** el servidor (motor, no Action ni UI) **rechaza toda transición a en_curso sin checklist completa** — test E2E `checklist-bloqueante.spec.ts`

### Story 4.2: Cola offline local con feedback visible

As a paseador,
I want que checklist, inicio y registro funcionen sin señal y SIEMPRE saber qué está sincronizado,
So that el método no colapsa en un subterráneo y yo no aprieto "guardar" tres veces por pánico.

**Acceptance Criteria:**

**Given** que estoy sin conexión
**When** completo checklist, inicio o registro
**Then** la app lo acepta y encola localmente; el **contrato del evento incluye timestamp de origen del dispositivo** y tipo de evento (definido aquí, consumido por 4.3-4.5)
**And** un **indicador persistente** muestra siempre el estado: "guardado en el teléfono / N pendientes de enviar / todo sincronizado"
**When** aprieto "guardar" repetidamente sin señal
**Then** no se generan eventos duplicados (deduplicación por id local)

### Story 4.3: Sincronización con validación de orden

As a admin,
I want que lo capturado offline llegue al servidor validado y en orden,
So that la trazabilidad del método es confiable aunque la red no lo sea.

**Acceptance Criteria:**

**Given** eventos encolados localmente (4.2)
**When** vuelve la conexión
**Then** la cola sincroniza sola, en orden; el servidor valida la secuencia (checklist → inicio → fin) usando los timestamps de origen y **rechaza secuencias inválidas** (ej: fin sin checklist previa) con error visible
**And** los eventos aceptados registran ambas horas: la del dispositivo (cuándo ocurrió) y la del servidor (cuándo llegó) — auditables en `event_log`

### Story 4.4: Registro post-paseo de un toque, con fotos

As a paseador,
I want registrar cómo estuvo el perro en menos de 2 minutos, sin pelear con el teclado,
So that registro de verdad (no por cumplir) y el historial se alimenta de datos reales.

**Acceptance Criteria:**

**Given** un paseo en curso
**When** lo finalizo
**Then** registro **todo con toques, sin teclado**: pipí/caca = botones que cuentan toques; estado emocional = 4 opciones grandes (calma/excitación/estrés/ansiedad); hidratación = sí/no; conductas = chips multi-select de la taxonomía del método; un único campo de texto **opcional** "algo más" (FR-028)
**When** adjunto 1-2 fotos
**Then** se comprimen en cliente (helper 1.4: ≤1600px, ≤400KB) y suben a R2 con reintento; sin señal, quedan en la cola de 4.2 (FR-030)
**And** el flujo completo toma <2 minutos con una mano (NFR-01) — verificado en prueba real con los paseadores

### Story 4.5: Incidentes — capturar primero, narrar después

As a paseador,
I want dejar constancia de un incidente con un toque y completar el detalle cuando el perro esté seguro,
So that el registro es real: en una pelea mis dos manos están salvando al perro, no escribiendo.

**Acceptance Criteria:**

**Given** un paseo en curso o recién finalizado
**When** toco el botón de incidente (grande, rojo, siempre visible) y elijo el tipo (escape/pelea/mordida/lesión/pánico)
**Then** queda constancia inmediata con **hora del evento** (un solo toque); el detalle (descripción, acciones, si informé al tutor) se completa después con **hora de registro separada** (FR-029)
**When** el incidente se sincroniza
**Then** aparece destacado en el tablero admin y se envía email inmediato a los admins; queda en `event_log` inmutable con el historial del perro
**And** el incidente se crea con **severidad** (baja/media/alta) y **código humano `INC-`** (`lib/codes.ts`), y su estado de vida arranca en `abierto` (la resolución es Story 4.7) — addendum architecture.md 12-06-2026

### Story 4.6: Reporte al tutor por plan

As a paseador,
I want que el reporte para el tutor se genere al instante, incluso sin señal,
So that lo envío por WhatsApp en el momento, que es cuando el tutor lo espera.

**Acceptance Criteria:**

**Given** un paseo completado con registro
**When** abro "Reporte"
**Then** el texto se genera **localmente con los datos ya en el teléfono** (motor `reportes.ts` compartido cliente/servidor) según plan — BASE: breve; PLUS: + logros y fotos; ELITE: profesional extendido — con formato WhatsApp y botón "copiar" de un toque (FR-031)
**And** el reporte **lee snapshots y datos registrados, jamás recalcula precios ni totales**
**When** lo marco como enviado
**Then** el estado cambia a "enviado" con fecha (se sincroniza si estaba offline); los admins ven todos los reportes con estado e historial por perro/tutor/paseador (FR-032)

### Story 4.7: Resolución de incidentes por admin

> Insertada por la evaluación del doc de visión (addendum architecture.md 12-06-2026): cierra el ciclo de vida del incidente que la 4.5 deja "abierto".

As a admin,
I want revisar y cerrar los incidentes reportados con notas de operaciones,
So that ningún incidente queda como una alerta perdida — hay respaldo profesional de qué pasó y cómo se resolvió (NFR-05).

**Acceptance Criteria:**

**Given** un incidente `abierto` reportado por un paseador (Story 4.5)
**When** lo abro desde el tablero admin
**Then** veo su tipo, severidad, código `INC-`, hora del evento, descripción, paseo/perro/paseador relacionados, y puedo pasarlo a `en_revisión`
**When** lo resuelvo con notas de operaciones (o lo escalo)
**Then** queda `resuelto` o `escalado` con mi autoría, fecha y notas en `event_log`; la máquina de estados vive en `lib/engine/incidente-estados.ts` (patrón motor por entidad)
**And** el tablero distingue incidentes abiertos/en revisión de los resueltos; los abiertos de severidad alta se destacan

## Epic 5: Cobros claros — modalidades, pagos y liquidaciones

El ciclo económico completo, leyendo snapshots — nunca recalculando.

### Story 5.1: Motor de cobros sobre snapshots

As a admin,
I want el motor que calcula cobrables y comisiones leyendo los valores congelados de cada paseo,
So that los cambios de tarifa nunca reescriben la historia contable.

**Acceptance Criteria:**

**Given** paseos con `precio_clp_snapshot` (poblado en 3.2 al materializar) y el % del paseador
**When** un paseo pasa a "completado" o "cancelado-cobrable"
**Then** se escribe `comision_pct_snapshot` (el % vigente del paseador final asignado) — el precio ya estaba congelado desde la materialización (FR-034/036)
**When** un admin cambia tarifas o % después
**Then** los paseos ya nacidos/completados no cambian; solo los futuros usan valores nuevos
**And** `lib/engine/cobros.ts` es puro, **solo lee snapshots** (jamás recalcula de tarifas vigentes), cubre las 6 modalidades y tiene tests unitarios de cada una + casos de cancelado-cobrable

### Story 5.2: Estado de cuenta y registro de pagos

As a admin,
I want ver cuánto debe cada tutor según su modalidad y registrar sus transferencias,
So that dejo de perseguir pagos con la memoria.

**Acceptance Criteria:**

**Given** un tutor con modalidad configurada (por paseo / semanal / mensual × pre/postpago) (FR-033)
**When** abro su estado de cuenta
**Then** veo el cobrable del período (completados + cancelados-cobrables, desde snapshots) y su estado: al día / pendiente / moroso (FR-034/035)
**When** registro un pago (fecha, monto, referencia de transferencia)
**Then** se aplica contra el cobrable y queda en `event_log`
**And** el registro de pago es **idempotente** por `(tutor, periodo)`: registrar dos veces el mismo pago no lo duplica (patrón unique constraint; addendum architecture.md 12-06-2026)

### Story 5.3: Saldo prepago

As a admin,
I want gestionar paquetes prepagados con su saldo visible,
So that vendo paquetes sin perder la cuenta de lo consumido.

**Acceptance Criteria:**

**Given** un tutor prepago con paquete registrado (N paseos contratados)
**When** sus paseos se completan (o cancelan-cobrables)
**Then** el saldo descuenta automáticamente y veo contratado vs consumido vs restante (FR-040)
**When** el saldo llega a 2 paseos o se agota
**Then** el tablero admin lo alerta para renovar la venta

### Story 5.4: Liquidaciones de comisiones

As a admin,
I want liquidar las comisiones de cada paseador por período con detalle,
So that el cierre de mes toma minutos y no tiene errores.

**Acceptance Criteria:**

**Given** paseos completados en el período (quincenal o mensual, configurable)
**When** genero la liquidación de un paseador
**Then** se calcula Σ (precio_snapshot × pct_snapshot) con **detalle por paseo**, en estado "borrador" (FR-037)
**When** la apruebo y luego registro su pago
**Then** transiciona borrador → aprobada → pagada, cada paso con autoría en `event_log`; los cancelados-cobrables no generan comisión salvo override explícito (FR-022)
**And** la liquidación lleva **código humano `LIQ-`** (`lib/codes.ts`) y su máquina de estados vive en `lib/engine/liquidacion-estados.ts` (patrón motor por entidad)
**And** el desglose por paseo de la liquidación es **exactamente el mismo origen de datos** que verá el paseador en 5.5 — una sola verdad

### Story 5.5: Mis comisiones (paseador)

As a paseador,
I want ver mis comisiones acumuladas y mis liquidaciones con el mismo detalle que ve el admin,
So that confío en la transparencia del sistema (diferenciador vs marketplaces).

**Acceptance Criteria:**

**Given** paseos completados por mí en el período actual
**When** abro "Mis comisiones"
**Then** veo lo acumulado (desde los mismos snapshots y el mismo desglose por paseo que 5.4 — misma query/motor, misma verdad) y el historial de liquidaciones con detalle y estado (FR-038)
**And** mi % vigente es visible en mi perfil — sin sorpresas

### Story 5.6: Conciliación mensual con arrastre

> Insertada por la evaluación del doc de visión (addendum architecture.md 12-06-2026). Aplica solo a modalidades mensual/prepago (FR-040).

As a admin,
I want cerrar el mes por tutor con el detalle de paseos ejecutados, cancelados y arrastrados,
So that el cobro mensual cuadra con lo realmente entregado y nada se pierde ni se cobra de más.

**Acceptance Criteria:**

**Given** un tutor con modalidad mensual o prepago al cierre del período
**When** previsualizo la conciliación del mes
**Then** veo paseos contratados vs. completados vs. cancelados, y los **cancelados por operaciones/perdidos se arrastran** al período siguiente (los cancelados por el tutor fuera de plazo cuentan como ejecutados, no arrastran) — leyendo snapshots, jamás recalculando
**When** cierro el mes
**Then** queda una conciliación inmutable en `event_log` con el arrastre aplicado al saldo/cobrable del período siguiente; el motor `lib/engine/cobros.ts` calcula el arrastre (regla pura, testeada)
