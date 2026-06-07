---
title: "PRD: Plataforma Labradog — Fase de prueba"
status: final
created: 2026-06-06
updated: 2026-06-06
---

# PRD: Plataforma Labradog — Fase de prueba

## 1. Contexto y objetivo

Labradog opera un servicio profesional de paseo de perros con un método propio (capacitación de 9 etapas, protocolos obligatorios, planes BASE/PLUS/ELITE) que hoy se gestiona por WhatsApp y planillas, con techo de ~10 perros. Este PRD define la **plataforma de gestión interna** para la fase de prueba: 30 tutores, 3-4 paseadores certificados, en ~2 meses de desarrollo IA-first.

**Lo que este PRD cubre:** los 4 módulos de la fase de prueba — Capacitación, Agenda, Registro operativo, Cobros — más la base transversal (usuarios, fichas).
**Lo que no cubre:** portal de tutores, pasarela de pagos, GPS/audiovisual, WhatsApp API, seguro ELITE, perfil público del paseador con badge y calificaciones, promesa visible de "reemplazo garantizado" cara al tutor (todo post-prueba; ver brief).

**Principios de producto** (diferenciadores del brief que guían cualquier decisión de diseño): (1) transparencia total de precios y comisiones hacia el paseador; (2) el reporte es conductual y profesional, nunca "foto + distancia"; (3) equipo certificado con estándar, no marketplace — la plataforma hace cumplir el método, no lo sugiere.

## 2. Usuarios y roles

| Rol | Quiénes | Qué hace en la plataforma |
|---|---|---|
| **Admin** | Nelson + socios (existe más de un admin) | Todo: fichas, agenda, evaluación de capacitación, cobros, configuración |
| **Paseador** | 2 actuales → 4+ en prueba | Su capacitación, su agenda, checklists y registros de sus paseos, sus comisiones |

El **tutor no es usuario** en v1: existe como ficha gestionada por admins; interactúa por WhatsApp fuera de la plataforma.

No hay jerarquía entre admins (cualquiera evalúa, agenda y cobra). Toda acción queda registrada con autor y fecha (ver NFR-04).

## 3. Recorridos clave (resumen)

- **Paseador en certificación:** Tomás (nuevo paseador) entra a su plan de capacitación, ve la etapa 3 desbloqueada, estudia el contenido, rinde el test y queda a la espera de la evaluación práctica que un admin registra tras observarlo en calle. Su avance es visible para él y para los admins.
- **Día del paseador:** Carla abre su agenda del día en el celular, ve 4 paseos asignados, parte el primero completando la checklist pre-paseo (sin eso el paseo no se inicia), registra el paseo al terminar y la plataforma le genera el reporte que copia a WhatsApp del tutor.
- **Día del admin:** Nelson revisa el tablero: paseos de hoy, quién los cubre, una cancelación que requiere reasignar, dos reportes de ayer pendientes de envío, y el estado de cobros del mes por tutor.

## 4. Requisitos funcionales

### Módulo 0 — Base: acceso y fichas

**F0.1 Autenticación y roles**
- **FR-001** El sistema permite iniciar sesión con email y contraseña, con recuperación de contraseña.
- **FR-002** Existen dos roles: admin y paseador. Los admins crean cuentas (no hay auto-registro abierto).
- **FR-003** Soporte multi-admin: puede existir más de un admin con permisos plenos e idénticos.

**F0.2 Ficha del tutor**
- **FR-004** Los admins gestionan fichas de tutor: datos de contacto, dirección de retiro, acuerdo comercial (plan por defecto y modalidad de cobro), estado (activo/pausado/cerrado). El plan por defecto se hereda al crear recurrencias y puede sobreescribirse por paseo (el plan efectivo vive en el paseo — FR-019).
- **FR-005** La ficha registra la **entrevista inicial** (estructura del método: historial del perro, reactividad, escapes previos, equipamiento, expectativas) y las **red flags** detectadas; con 2+ red flags el sistema sugiere evaluar rechazo del servicio.
- **FR-006** La ficha permite registrar la aceptación de los **anexos legales** (límites del servicio y compromiso ético) con fecha y medio de aceptación. En v1 basta registrar que se firmaron (papel/PDF externo); no hay firma electrónica en plataforma.

**F0.3 Ficha del perro**
- **FR-007** Cada tutor tiene 1+ perros con perfil: nombre, foto, raza, grupo de raza operativo (trabajo/guardia, pastora, caza, otro), edad, talla, condición física, temperamento, equipamiento (arnés/correa), premios aceptados, notas de manejo.
- **FR-008** El perfil registra **compatibilidad** entre perros del mismo tutor (para paseos de hasta 3 perros del mismo tutor, regla del plan BASE).
- **FR-009** El perfil mantiene historial visible: paseos, incidentes, evolución del estado emocional reportado.

**F0.4 Ficha del paseador**
- **FR-039** Cada paseador tiene ficha gestionada por admins: datos de contacto, estado de certificación, % de comisión vigente (FR-036), **especialidades de caminata** (energética / senior / olfatoria — taxonomía del método y del mercado) y notas. La especialidad informa la asignación de paseos (FR-023) sin bloquearla.

### Módulo 1 — Capacitación y certificación (Fase A)

**F1.1 Contenido del programa**
- **FR-010** El programa de capacitación se estructura en las 9 etapas + módulo de razas, con el contenido proveniente de los documentos existentes (`archivos del proyecto\`), navegable por etapa desde la plataforma.
- **FR-011** Las etapas se desbloquean secuencialmente: no se accede a la etapa N+1 sin aprobar la etapa N. El módulo de razas se rinde después de la etapa 9.

**F1.2 Evaluaciones teóricas**
- **FR-012** Las etapas con test (1, 2, 3, 5) se evalúan con cuestionarios de selección múltiple autocorregibles. Nota mínima de aprobación: 80%; intentos ilimitados con feedback por pregunta.
- **FR-013** El examen final (etapa 9) se construye desde el **banco de 100 preguntas**, con selección aleatoria por rendición. 30 preguntas por rendición, 80% para aprobar.

**F1.3 Evaluaciones prácticas**
- **FR-014** Las etapas prácticas (4: ejercicios de decisión; 5: paseo guiado; 6: simulación de emergencia; 7: role-play tutor; 8: checklist en terreno) las aprueba un admin registrando veredicto (aprobado/repetir), observaciones y fecha.
- **FR-015** Las plantillas de evaluación existentes (casos etapa 6, plantilla etapa 7, plantilla de registro etapa 8) están disponibles como pauta del evaluador dentro de la plataforma.

**F1.4 Certificación**
- **FR-016** Al aprobar las 9 etapas + módulo de razas, el sistema otorga la certificación "Paseador de Perros Profesional - Entorno Urbano" con fecha y evaluadores, y habilita al paseador para recibir paseos asignados.
- **FR-017** Un paseador **no certificado no puede tener paseos asignados** (regla dura del negocio). Excepción de transición: los admins pueden marcar a los 2 paseadores actuales como "habilitados en certificación" mientras completan el programa. El estado vence a los 30 días (configurable); vencido sin certificar, el paseador no recibe paseos nuevos hasta certificarse (los ya asignados se reasignan).
- **FR-018** Los admins ven un tablero de avance de capacitación: paseadores en programa, etapa actual, evaluaciones pendientes de revisar.

### Módulo 2 — Agenda (Fase A)

**F2.1 Recurrencia**
- **FR-019** La agenda se basa en **paseos recurrentes fijos** por perro: días de la semana + hora + **bloque contratado (1 o 2 horas)** + plan (BASE/PLUS/ELITE) + paseador asignado. La recurrencia genera automáticamente los paseos de cada semana. El bloque determina el precio (FR-034); la duración real del paseo se registra aparte (FR-028) y no altera el precio (el método ajusta duración por bienestar, no por reloj).
- **FR-020** Se pueden crear además **paseos puntuales** (no recurrentes) para casos a demanda.

**F2.2 Excepciones**
- **FR-021** Un paseo generado puede: cancelarse (registrando quién canceló — tutor o Labradog — y cuándo), reagendarse, o reasignarse a otro paseador (reemplazo).
- **FR-022** Política de cancelación del tutor: cancelación mismo día queda registrada como "cobrable" por defecto, con override del admin (decisión comercial caso a caso). Un paseo cancelado-cobrable **suma al cobrable del tutor** (FR-034) pero **no genera comisión al paseador** por defecto (el admin puede otorgarla como override en la liquidación, FR-037).
- **FR-023** El sistema valida al asignar: paseador certificado (FR-017), sin tope de horario con otro paseo suyo, y ratio máximo de perros por paseo (1-2; hasta 3 si son del mismo tutor y compatibles según FR-008).

**F2.3 Vistas**
- **FR-024** Paseador: su agenda diaria/semanal (perro, dirección de retiro, hora, plan, notas de manejo del perro).
- **FR-025** Admin: vista global por día/semana — todos los paseos, estado (pendiente/en curso/completado/cancelado), cobertura, huecos por cancelaciones.

**F2.4 Notificaciones (email, v1)**
- **FR-041** El paseador recibe notificaciones por email: (a) resumen matinal diario con sus paseos del día; (b) aviso inmediato ante asignación, reasignación o cancelación de un paseo suyo. Los admins reciben email inmediato ante registro de incidente (complementa FR-029). Canal v1: solo email; push/WhatsApp diferidos a post-prueba.

### Módulo 3 — Registro operativo (Fase B)

**F3.1 Checklist pre-paseo**
- **FR-026** Antes de iniciar un paseo, el paseador completa la checklist pre-paseo del método (equipo correcto, ajuste dos dedos, correa funcional, clima evaluado, teléfono cargado, contacto tutor, premios). **El paseo no puede pasar a "en curso" sin checklist completa.**
- **FR-027** La checklist queda asociada al paseo con hora de completado.

**F3.2 Registro del paseo**
- **FR-028** Al finalizar, el paseador registra: duración real, estado emocional del perro (calma/excitación/estrés/ansiedad — taxonomía del método), pipí/caca, hidratación, conductas observadas, ajustes realizados.
- **FR-029** **Incidentes** se registran con tipo (escape, pelea, mordida, lesión, crisis de pánico — taxonomía etapa 6), descripción, acciones tomadas y si se informó al tutor. Un incidente notifica a los admins de inmediato (visible en su tablero).
- **FR-030** El paseador puede adjuntar 1-2 fotos al registro (requisito del plan PLUS).

**F3.3 Reporte al tutor**
- **FR-031** Desde el registro, el sistema genera el **reporte para el tutor** en texto listo para copiar a WhatsApp, con formato según plan (BASE: breve; PLUS: + logros y fotos; ELITE: profesional extendido).
- **FR-032** El reporte queda **visible para los admins** en la plataforma — historial completo consultable por perro, tutor y paseador — con estado de envío (generado / enviado) marcado por quien lo envía.

### Módulo 4 — Cobros y comisiones (Fase B)

**F4.1 Cobro a tutores — modalidades flexibles**
- **FR-033** Cada tutor se configura con su modalidad de cobro: **por paseo, semanal, o mensual; prepago o postpago** — la flexibilidad comercial es requisito (adaptarse al cliente para cerrar la venta).
- **FR-034** El precio de cada paseo queda determinado por **plan × bloque contratado** (1 hr: $10.000/$12.000/$15.000; 2 hrs: $18.000/$20.000/$25.000 — tarifas editables por admin) y **se congela al momento del paseo**. El cobrable por período suma: paseos completados + cancelados-cobrables (FR-022); en prepago, lo contratado del paquete (FR-040).
- **FR-035** Los admins registran pagos recibidos (transferencia: fecha, monto, referencia) contra lo cobrable, y ven el estado de cuenta por tutor (al día / pendiente / moroso).
- **FR-040** En modalidad **prepago**, el tutor tiene un saldo de paquete: paseos contratados vs consumidos. El sistema descuenta por paseo completado (y cancelado-cobrable), muestra el saldo restante al admin y alerta cuando se agota o está por agotarse.

**F4.2 Comisiones a paseadores**
- **FR-036** Cada paseador tiene su **% de comisión configurable por admin** (rango válido 60-80%). Default por nivel: 60% recién certificado, 70% tras 100 paseos sin incidentes graves, 80% para senior/evaluador. El % aplicado queda fijado en cada paseo al momento de completarse.
- **FR-037** Liquidación por período (quincenal o mensual, configurable): paseos completados × tarifa × % del paseador, con detalle por paseo, estado (borrador / aprobada / pagada) y registro del pago.
- **FR-038** El paseador ve sus comisiones acumuladas del período y el historial de liquidaciones (transparencia — diferenciador vs marketplaces).

## 5. Requisitos no funcionales

- **NFR-01 Idioma y simplicidad:** toda la interfaz en español (Chile). Usuarios no técnicos: cada flujo del paseador debe completarse en el celular, en la calle, en menos de 2 minutos (checklist, registro).
- **NFR-02 Responsive móvil primero** para el rol paseador; el admin se usa principalmente en desktop pero debe funcionar en móvil.
- **NFR-03 Datos personales:** datos de tutores conforme a Ley 19.628 (Chile): solo lo necesario, sin compartir con terceros. Sin requisitos de certificación formal en v1.
- **NFR-04 Auditabilidad:** toda escritura relevante (evaluaciones, cambios de agenda, registros, pagos, liquidaciones) guarda autor y timestamp. El método vive de la trazabilidad.
- **NFR-05 Disponibilidad y respaldo:** operación de negocio pequeño — sin alta disponibilidad exigida, pero con respaldo diario automático de datos. Pérdida de registros = pérdida del respaldo profesional ante incidentes.
- **NFR-06 Costo:** infraestructura de costo mínimo (objetivo < $20 USD/mes en fase de prueba).
- **NFR-07 Mantenibilidad IA-first:** stack mainstream y bien documentado, apto para desarrollo y mantención asistidos por IA con supervisión de un no-programador-activo (decisión concreta en arquitectura).

## 6. Métricas de éxito y contramétricas

| Métrica (del brief) | Contramétrica (que evita el atajo) |
|---|---|
| 2 paseadores certificados en el mes 1 | Tests aprobados con comprensión real: tasa de aprobación del examen final en 1er intento (si es 100% siempre, el examen es trivial) |
| 100% de paseos con checklist + registro | Tiempo de llenado de checklist (si es < 15 seg, se está marcando sin hacer) |
| 30 tutores sin planillas | Nº de "vueltas a la planilla" — cosas que la plataforma no pudo registrar (medir por feedback semanal) |
| Cierre de comisiones en minutos | Nº de liquidaciones corregidas después de aprobadas |

## 7. Fases de entrega

| Fase | Semanas | Módulos | Hito de salida |
|---|---|---|---|
| **A** | 1-4 | Base (F0) + Capacitación (F1) + Agenda (F2) | 2 paseadores capacitándose en plataforma; agenda real operando |
| **B** | 5-8 | Registro (F3) + Cobros (F4) | Fase de prueba completa: paseos con checklist/registro/reporte y primer ciclo de cobro/liquidación |

## 8. Preguntas abiertas

1. **Esquema de comisiones** (FR-036): aprobado por Nelson como base (% por paseador, default por nivel 60/70/80); ratificar % y umbrales con los socios. *Owner: Nelson. Revisar: antes de Fase B.*
2. **Planilla actual**: pendiente que Nelson la comparta para reconciliar campos de fichas (FR-004/007) con lo que hoy registra. *Owner: Nelson. Revisar: inicio de Fase A.*

Resueltas el 06-06-2026: política de cancelación (cobrable por defecto + override admin, FR-022), nota mínima de tests y reintento (80%, ilimitados, FR-012/013).
