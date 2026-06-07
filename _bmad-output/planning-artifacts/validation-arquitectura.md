---
title: "Validación de Arquitectura vs PRD — Labradog"
status: review
created: 2026-06-06
reviewer: "Arquitecto revisor (auditoría de coherencia y cobertura)"
sources:
  - prd.md (fuente de verdad)
  - architecture.md (documento auditado)
---

# Validación de Arquitectura vs PRD — Labradog

**Veredicto general: LISTA CON BRECHAS MENORES.**

La arquitectura es sólida, coherente y bien dimensionada para el PRD. Cubre arquitectónicamente los 40 FRs y los 7 NFRs sin requisitos huérfanos. El stack es internamente consistente y apto para mantención IA-first. Las brechas son de **especificación de detalle de implementación**, no de cobertura ni de coherencia. Un agente IA podría arrancar, pero hay 3-4 ambigüedades operativas que conviene cerrar antes de implementar los módulos donde viven (Agenda y Registro principalmente), para evitar que el agente improvise decisiones de negocio.

---

## 1. Cobertura de requisitos

### 1.1 Requisitos funcionales (FR-001 a FR-040)

Recorrido FR por FR. "Soporte" = existe componente/módulo/patrón identificable donde el FR vive.

| FR | Soporte arquitectónico | Estado |
|---|---|---|
| FR-001 Login email/pass + recuperación | Better Auth v1.6 (sección Auth & Security) | ✅ |
| FR-002 Dos roles, sin auto-registro | Columna `role` + "Sin auto-registro: cuentas creadas por admins" | ✅ |
| FR-003 Multi-admin permisos idénticos | Rol admin plano; concern #7 (concurrencia multi-admin) | ✅ (ver brecha B-IMP-1 sobre concurrencia) |
| FR-004 Ficha tutor + plan por defecto heredable | `fichas.ts`, `admin/tutores`; snapshot de plan en paseo (Inmutabilidad económica) | ✅ |
| FR-005 Entrevista inicial + red flags + sugerencia rechazo | `admin/tutores`, catálogo de red flags (concern #4) | ⚠️ parcial — la **regla "2+ red flags sugiere rechazo"** no aparece como lógica de motor/validación (ver B-MEN-1) |
| FR-006 Aceptación anexos legales (registro, sin firma) | `fichas.ts` (campos de registro) | ✅ |
| FR-007 Ficha perro + grupo de raza operativo | `admin/perros`, catálogo grupos de raza (concern #4) | ✅ |
| FR-008 Compatibilidad entre perros del tutor | Mencionado en validación de ratio (FR-023 → `recurrencia.ts`) | ⚠️ parcial — dónde se **almacena** la matriz de compatibilidad no está modelado explícitamente (ver B-MEN-2) |
| FR-009 Historial visible del perro | Modelo relacional + "modelo que hace triviales los reportes" (concern #8) | ✅ |
| FR-010 Programa 9 etapas + módulo razas, navegable | `scripts/seed-capacitacion.ts`, `paseador/mi-capacitacion` | ✅ |
| FR-011 Desbloqueo secuencial | `engine/certificacion.ts` (desbloqueo etapas) | ✅ |
| FR-012 Tests autocorregibles 80%, intentos ilimitados | `certificacion.ts` (scoring tests) | ✅ |
| FR-013 Examen final desde banco de 100, 30 aleatorias | seed banco 100 + `certificacion.ts` | ⚠️ parcial — **selección aleatoria** (30 de 100) no está descrita como responsabilidad explícita de un módulo (ver B-MEN-3) |
| FR-014 Evaluaciones prácticas con veredicto admin | `admin/capacitacion`, `capacitacion.ts`, `event_log` | ✅ |
| FR-015 Plantillas de evaluación como pauta | seed capacitación / contenido | ✅ |
| FR-016 Certificación al completar todo + habilita paseos | `certificacion.ts` (gate) | ✅ |
| FR-017 No certificado no recibe paseos + transición 30 días | Gate de certificación = validación de agenda (Dependencias cruzadas) | ⚠️ parcial — el **vencimiento a 30 días configurable** y la **reasignación automática de los ya asignados** al vencer no tienen mecanismo de disparo definido (cron vs on-demand) (ver B-IMP-2) |
| FR-018 Tablero avance capacitación | `admin/capacitacion` | ✅ |
| FR-019 Recurrencia: días+hora+bloque+plan+paseador; genera semanales; snapshot precio | `engine/recurrencia.ts`, `recurrencias` table, snapshot económico | ✅ (lógica) — pero ver B-CRIT-1 (gatillo de generación) |
| FR-020 Paseos puntuales | `agenda.ts` / modelo paseos | ✅ |
| FR-021 Cancelar/reagendar/reasignar con autor | Estados de paseo + auditoría `*_by/*_at` | ✅ |
| FR-022 Cancelación cobrable + override admin + comisión opcional | `cobros.ts`, `event_log` (overrides) | ✅ |
| FR-023 Validaciones de asignación (cert, tope horario, ratio) | `recurrencia.ts` (validaciones) | ✅ |
| FR-024 Agenda paseador diaria/semanal | `paseador/mi-agenda` | ✅ |
| FR-025 Vista admin global por día/semana | `admin/agenda` | ✅ |
| FR-026 Checklist pre-paseo bloqueante | `ChecklistPrePaseo.tsx`, regla de servidor (concern #3), E2E checklist-bloqueante | ✅ |
| FR-027 Checklist asociada al paseo con hora | Modelo paseos + auditoría | ✅ |
| FR-028 Registro final (duración, estado emocional, etc.) | `paseador/paseo/[id]`, `paseos.ts`, catálogo estados emocionales | ✅ |
| FR-029 Incidentes + notificación inmediata a admins | `paseos.ts`, catálogo incidentes, tablero admin | ⚠️ parcial — la **notificación inmediata** se resuelve como "visible en tablero" (pull). No hay mecanismo push/realtime; aceptable a esta escala pero conviene declararlo (ver B-MEN-4) |
| FR-030 1-2 fotos al registro (PLUS) | `storage.ts` (R2), Cloudflare R2 | ✅ |
| FR-031 Reporte WhatsApp por plan | `engine/reportes.ts` | ✅ |
| FR-032 Reporte visible admins + estado envío | Modelo + `admin`, marcado por quien envía | ✅ |
| FR-033 Modalidades de cobro flexibles (6) | `engine/cobros.ts` (6 modalidades) | ✅ |
| FR-034 Precio plan×bloque, congelado, suma cobrable | snapshot económico + `cobros.ts` | ✅ |
| FR-035 Registro de pagos + estado de cuenta | `admin/cobros`, `cobros.ts`, `event_log` | ✅ |
| FR-036 % comisión configurable 60-80%, fijado por paseo | snapshot de % en paseo (Inmutabilidad económica) | ✅ |
| FR-037 Liquidación por período + estados + pago | `admin/liquidaciones`, `cobros.ts`, E2E liquidación | ✅ |
| FR-038 Paseador ve comisiones + historial | `paseador/mis-comisiones` | ✅ |
| FR-039 Ficha paseador + especialidades | `admin/paseadores`, `fichas.ts`, catálogo especialidades | ✅ |
| FR-040 Prepago: saldo de paquete + alertas | `cobros.ts` (saldos), `admin/cobros` | ✅ |

**Resultado FRs:** 0 FRs SIN soporte. Todos tienen un hogar arquitectónico identificable. 7 FRs tienen soporte **parcial** (la ubicación existe pero una sub-regla o un disparador concreto no está especificado): FR-005, FR-008, FR-013, FR-017, FR-019 (gatillo), FR-029. Ninguno es un agujero de cobertura; son detalles de implementación pendientes.

### 1.2 Requisitos no funcionales (NFR-01 a NFR-07)

| NFR | Soporte arquitectónico | Estado |
|---|---|---|
| NFR-01 Español + flujos <2 min en celular | Regla de dominio en español; móvil primero; `useActionState` sin spinners globales | ✅ (cobertura técnica; el "<2 min" es validable solo en pruebas de uso) |
| NFR-02 Responsive móvil primero paseador | "Móvil primero en vistas del paseador; desktop primero admin" | ✅ |
| NFR-03 Ley 19.628 (minimización, sin terceros) | Cifrado at-rest Neon + HTTPS; sin integraciones externas | ✅ |
| NFR-04 Auditabilidad (autor+timestamp) | 4 columnas en toda tabla + `event_log`; enforcement #4 | ✅ (cobertura fuerte) |
| NFR-05 Respaldo diario automático | Backups automáticos de Neon | ✅ |
| NFR-06 < $20 USD/mes | ~$5-7/mes (Railway + Neon free + R2 free) | ✅ |
| NFR-07 Mantenibilidad IA-first | Stack mainstream, monolito, `project-context.md`, AGENTS.md, seeds, tests E2E | ✅ (núcleo de la arquitectura) |

**Resultado NFRs:** 0 NFRs sin soporte. Todos cubiertos. NFR-03 cubre lo razonable a esta escala; un detalle fino (retención/borrado de datos personales al cerrar ficha de tutor — derecho de cancelación Ley 19.628) no está modelado, pero es menor para fase de prueba.

---

## 2. Coherencia de decisiones

**Conclusión: el stack es internamente coherente. No se encontraron contradicciones bloqueantes.** Las tecnologías encajan y los patrones refuerzan las decisiones en lugar de contradecirlas.

Validaciones positivas:

- **Next.js 16.2 + Drizzle 0.45 + Better Auth v1.6 + Neon Postgres** es una combinación mainstream y compatible. Server Actions + RSC + Drizzle es un patrón documentado y sin fricción.
- **Server Actions en vez de tRPC/REST** es coherente con "2 roles, sin consumidores externos en v1" y con NFR-07 (menos indirección = más legible para IA). El descarte de t3/tRPC está bien justificado.
- **Motores puros sin I/O en `lib/engine/`** + "UI → Actions → Engine → DB" es una frontera limpia y consistente con la testabilidad (Vitest sobre motores) y con la futura capa API post-prueba. No contradice nada.
- **Inmutabilidad económica (snapshot por paseo)** atraviesa coherentemente FR-019/034/036 y el flujo crítico de "completar paseo".
- **Dinero en enteros CLP** elimina la clase de bugs de floats; coherente con el dominio chileno.
- **Catálogos centralizados** (concern #4) son consistentes con las múltiples taxonomías del método.

Tensiones/observaciones de coherencia (no bloqueantes):

1. **Railway elegido sobre Vercel por la prohibición de uso comercial en Hobby** — decisión correcta y bien argumentada. Coherente con NFR-06. Implica que NO se usan features Vercel-only (no hay dependencia de ellas en el doc, así que OK).
2. **Cola local (localStorage + reintento) vs checklist bloqueante de servidor** — aquí hay una **tensión conceptual real** que el documento no resuelve explícitamente. La checklist es "regla de servidor, no de UI" (concern #6 y #3), pero también se ofrece cola offline para checklist/registro. Si el paseador completa la checklist sin red, ¿la transición a "en curso" ocurre localmente (optimista) y se confirma al sincronizar, o queda bloqueada hasta tener red? Las dos afirmaciones conviven sin reconciliarse. No es contradicción fatal (ambas pueden coexistir con una política de "optimista local, autoridad final servidor"), pero **debe especificarse** (ver B-CRIT-2).
3. **Concurrencia multi-admin (concern #7) "detección de edición simultánea"** se nombra como concern pero **no se elige mecanismo** (optimistic locking con columna de versión, `updated_at` check, etc.). Coherente en intención, incompleto en decisión (ver B-IMP-1).
4. **Sin caché + autoscale-a-cero de Neon:** el free tier de Neon con scale-to-zero introduce latencia de cold start. A <10 usuarios es aceptable, pero combinado con "flujos del paseador <2 min en la calle" (NFR-01) podría rozar la experiencia. Observación menor, no contradicción.

---

## 3. Preparación para implementación IA

**Veredicto: un agente IA sin contexto previo podría implementar la mayor parte con consistencia**, gracias a los patrones explícitos (naming español, estructura de carpetas, formato de retorno de actions, enforcement guidelines, mapeo módulo→estructura). La arquitectura es notablemente "IA-ready" en su nivel de prescripción de patrones.

Sin embargo, hay ambigüedades operativas que un agente resolvería **improvisando decisiones de negocio**, lo que rompe la consistencia. Las dos preguntas que el prompt anticipa están, en efecto, sin responder:

### 3.1 Cola offline vs checklist bloqueante de servidor — AMBIGUO
El documento afirma simultáneamente que (a) la checklist es bloqueante en **servidor** y (b) hay **cola local** para checklist/registro. No define qué pasa offline: ¿se permite iniciar el paseo localmente y reconciliar después, o el inicio queda bloqueado hasta sincronizar? ¿Qué ocurre si el servidor rechaza al sincronizar una checklist ya "completada" offline (el paseo ya transcurrió)? Esto es la regla de negocio MÁS crítica del producto (FR-026) cruzada con el concern operativo MÁS crítico (conectividad). Un agente IA elegirá una u otra semántica al azar. → **B-CRIT-2**

### 3.2 Generación de paseos recurrentes — AMBIGUO (gatillo no definido)
FR-019 dice "la recurrencia genera automáticamente los paseos de cada semana", pero la arquitectura describe `engine/recurrencia.ts` como **función pura sin I/O** — es decir, calcula, pero NO se dice **quién la invoca ni cuándo**. Opciones no resueltas: (a) cron/scheduled job semanal, (b) generación on-demand al abrir la agenda (lazy/materialización al consultar), (c) generación batch al crear/editar la recurrencia con horizonte fijo. Railway no tiene un mecanismo de cron declarado en el doc, y no hay `vercel.json`/cron job listado en la estructura. Esto afecta idempotencia (evitar duplicados), zona horaria (DST en el límite de semana) y la interacción con excepciones (un paseo reagendado/cancelado no debe re-generarse). Un agente IA necesita esta decisión para no producir duplicados o huecos. → **B-CRIT-1**

### 3.3 Otras ambigüedades para el agente
- **Vencimiento de "habilitado en certificación" (FR-017):** mismo problema de gatillo que la recurrencia — ¿cron diario que revisa los 30 días y reasigna, o evaluación lazy al asignar/consultar? Y la "reasignación de los ya asignados" no tiene flujo definido (¿automática a quién? ¿deja huecos para que el admin resuelva?). → **B-IMP-2**
- **Estado emocional histórico (FR-009/028):** el registro guarda estado emocional puntual; el historial "evolución del estado emocional" requiere consulta agregada — trivial, pero no descrito.
- **Reporte por plan (FR-031):** `reportes.ts` genera texto por plan, pero el **contenido/plantilla exacto** de BASE/PLUS/ELITE no está (es contenido, no arquitectura; aceptable, pero el agente lo inventará).
- **Selección aleatoria del examen (FR-013):** dónde vive la aleatoriedad (servidor, por rendición, sin repetir) no está dicho.
- **Reportes de negocio / export CSV (concern #8):** el propio doc lo marca como "mini-gap: el PRD no tiene FR de reportes de negocio". Queda fuera de alcance formal pero anotado.

---

## 4. Brechas clasificadas

### Críticas (bloquean implementación consistente)

- **B-CRIT-1 — Gatillo de generación de paseos recurrentes no definido.** FR-019 exige generación automática semanal; la arquitectura define el cálculo (motor puro) pero no el disparador (cron / on-demand / batch-con-horizonte), ni la estrategia de idempotencia, ni la interacción con excepciones y DST. Bloquea el módulo Agenda. **Acción:** decidir mecanismo (recomendado: job programado + materialización idempotente con clave única `(recurrencia_id, fecha)`), documentar en arquitectura y, si es cron, definir cómo se ejecuta en Railway.

- **B-CRIT-2 — Semántica offline de la checklist bloqueante sin resolver.** Coexisten "checklist bloqueante en servidor" y "cola local". No se define el comportamiento sin red ni la reconciliación al sincronizar. Es la regla de negocio central (FR-026) y el escenario operativo real del paseador en la calle. **Acción:** definir política explícita (ej.: inicio optimista local con la checklist completa, autoridad final del servidor al sincronizar, y manejo del caso de rechazo retroactivo) y reflejarla en el test E2E `checklist-bloqueante.spec.ts`.

### Importantes (moldean la arquitectura, deben cerrarse antes del módulo afectado)

- **B-IMP-1 — Mecanismo de concurrencia multi-admin no elegido.** Concern #7 nombra "detección de edición simultánea" pero no decide implementación. Riesgo concreto: doble asignación de un mismo slot/paseo (FR-003 + FR-021/023). **Acción:** elegir optimistic locking (columna `version`/`updated_at` con verificación en la action) y documentarlo como patrón transversal.

- **B-IMP-2 — Vencimiento y reasignación del estado "habilitado en certificación" (FR-017).** Sin gatillo (cron vs lazy) ni flujo de reasignación de paseos ya asignados al vencer los 30 días. **Acción:** definir disparador (probablemente el mismo job que la recurrencia) y la política de reasignación (recomendado: marcar paseos huérfanos como "requiere reasignación" en el tablero admin, no auto-reasignar).

### Menores (no bloquean; precisar para máxima consistencia)

- **B-MEN-1 — Regla "2+ red flags → sugerir rechazo" (FR-005)** no ubicada en un motor/validación. Trivial, pero conviene declararla (¿`engine` o derivación en query?).
- **B-MEN-2 — Almacenamiento de matriz de compatibilidad entre perros (FR-008)** no modelado explícitamente; la validación de ratio (FR-023) la consume pero no se dice dónde se persiste.
- **B-MEN-3 — Aleatoriedad del examen final (FR-013)** sin ubicación definida (servidor, por rendición, anti-repetición).
- **B-MEN-4 — Notificación de incidentes (FR-029)** resuelta como "visible en tablero" (pull). Aceptable a esta escala, pero declarar explícitamente que NO hay push/realtime evita que un agente intente integrar notificaciones.
- **B-MEN-5 — Retención/borrado de datos personales (NFR-03 / Ley 19.628)** al cerrar ficha de tutor no modelado (derecho de cancelación). Menor para fase de prueba.
- **B-MEN-6 — Reportes de negocio / export CSV (concern #8)** sin FR ni componente; ya anotado por el propio PM. Confirmar si entra o queda post-prueba.

---

## 5. Resumen ejecutivo

- **Cobertura:** 40/40 FRs con hogar arquitectónico; 7/7 NFRs cubiertos. Cero requisitos huérfanos. 7 FRs con cobertura parcial (sub-reglas/disparadores pendientes).
- **Coherencia:** stack internamente consistente; sin contradicciones tecnológicas; fronteras de capas limpias y bien justificadas.
- **Preparación IA:** alta en patrones (naming, estructura, formato, enforcement); media en decisiones operativas — dos disparadores de negocio sin definir (recurrencia y semántica offline) forzarían improvisación.
- **Veredicto: LISTA CON BRECHAS MENORES** a nivel de cobertura/coherencia, condicionada a cerrar **B-CRIT-1 y B-CRIT-2** antes de implementar Agenda (módulo 2) y Registro (módulo 3) respectivamente. El resto de la implementación (Base, Capacitación, Cobros) puede arrancar de inmediato.
