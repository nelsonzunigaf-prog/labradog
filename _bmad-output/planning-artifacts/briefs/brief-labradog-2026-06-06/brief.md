---
title: "Product Brief: Plataforma Labradog"
status: draft
created: 2026-06-06
updated: 2026-06-06
---

# Product Brief: Plataforma Labradog

## Resumen ejecutivo

Labradog es un servicio profesional de paseo de perros (Chile, Ley 21.020) con un estándar operativo poco común en el rubro: protocolos de seguridad escritos, un programa de capacitación de 9 etapas con certificación, y tres planes de servicio definidos (BASE/PLUS/ELITE). Hoy ese estándar vive en la cabeza del dueño, en documentos Word y en WhatsApp — y eso pone un techo de ~10 perros a la operación.

La Plataforma Labradog es una aplicación web de gestión interna que convierte ese estándar en software: capacitación y certificación de paseadores, agenda de paseos, registro operativo con checklists y reportes, y control de cobros y comisiones. El objetivo no es construir "otra app de paseos", sino el sistema operativo que permite que el estándar Labradog escale de 1 dueño-paseador a una red de paseadores certificados, partiendo con una fase de prueba de 30 tutores.

Se desarrolla con modalidad **IA-first**: Nelson lidera y supervisa como delivery manager; el desarrollo lo ejecuta IA (Claude Code) bajo el proceso BMAD.

## El problema

- **El estándar no escala.** Los protocolos (checklist pre-paseo, lectura del perro, registro, reportes) son obligatorios según el método Labradog, pero hoy dependen de la memoria y disciplina de una persona. Con paseadores nuevos, no hay forma de garantizar cumplimiento ni trazabilidad.
- **La capacitación es el cuello de botella.** 30 tutores ≈ 60-90 paseos/semana ≈ 3-4 paseadores activos. La regla del negocio es estricta: **nadie pasea sin certificarse**. Sin una plataforma de capacitación, formar cada paseador consume al dueño y no deja registro de quién aprobó qué.
- **La operación es artesanal.** Agenda mental/planillas, reportes manuales por WhatsApp, cobros por transferencia perseguidos uno a uno, comisiones (60-80%) calculadas a mano. A 10 perros funciona; a 30 tutores colapsa.
- **Costo del statu quo:** el dueño es el único punto de falla — sus vacaciones requieren reemplazos coordinados informalmente, y el crecimiento está congelado.

## La solución

Aplicación web interna con dos roles (administrador y paseador), en fases dentro de la ventana de 1-2 meses:

**Fase A — Capacitar y operar (semanas 1-4):**
- **Módulo Capacitación:** las 9 etapas + módulo de razas digitalizadas desde los documentos existentes; tests por etapa con el banco de 100 preguntas; registro de avance y certificación. Los 2 paseadores actuales son los primeros en certificarse.
- **Módulo Agenda:** calendario de paseos (perro, tutor, paseador, plan, horario), asignación y reemplazos.

**Fase B — Registrar y cobrar (semanas 5-8):**
- **Módulo Registro:** checklist pre-paseo obligatoria (el paseo no parte sin completarla), registro del paseo (duración real, estado emocional, incidentes), generación del reporte para enviar al tutor por WhatsApp. Todos los reportes quedan **visibles para el admin en la plataforma** — historial completo por perro, tutor y paseador.
- **Módulo Cobros:** registro de pagos de tutores (transferencia), cálculo automático de comisiones por paseador, estado de cuenta. El botón de pago integrado (Webpay/MercadoPago) queda para después de la fase de prueba; en la prueba se registran transferencias manualmente.

**El tutor no toca la plataforma en v1.** Sigue viviendo en WhatsApp (donde ya está cómodo); la plataforma genera lo que él recibe. Su portal de auto-servicio "básico y sin fricciones" es post-prueba.

## Qué lo hace diferente

- **El contenido ya existe.** Capacitación completa, protocolos, planes y anexos legales están escritos y probados en operación real. La plataforma digitaliza un negocio que funciona — no inventa uno.
- **Estándar como software:** la checklist que bloquea el inicio del paseo, el test que bloquea la certificación. La calidad deja de depender de la memoria.
- **Honestidad sobre el moat:** no hay moat tecnológico; la ventaja es el método Labradog y la velocidad de ejecución IA-first. Validado con benchmark (jun-2026): WOF — el referente local — selecciona con entrevistas y validación psicológica pero **no capacita técnicamente**; Dogin y Wagg compiten por precio y volumen. El estándar profesional certificado es el vacío del mercado chileno.

## A quién sirve

- **Nelson (admin):** visibilidad total de la operación sin estar presente; delegar sin perder el estándar.
- **Paseadores (2 hoy → 4+ en prueba):** un solo lugar para capacitarse, ver su agenda, completar registros y conocer sus comisiones.
- **Tutores (indirecto en v1):** persona con poco tiempo; recibe reportes consistentes y profesionales por WhatsApp. Usuario directo recién post-prueba.

## Criterios de éxito

1. Los 2 paseadores actuales **certificados en la plataforma** (9 etapas completas) dentro del primer mes de uso.
2. **100% de los paseos** de la fase de prueba con checklist pre-paseo y registro completados en la plataforma (hoy: 0%).
3. Operación de **30 tutores** gestionada sin planillas: agenda, registros y comisiones viven en la plataforma.
4. Cierre de mes de comisiones en **minutos, no horas**, sin errores de cálculo.
5. Nelson puede tomar vacaciones con la operación corriendo — el estándar ya no depende de su presencia.

## Alcance

**Dentro (fase de prueba):** web app responsive (uso en celular por paseadores), roles admin/paseador, capacitación + certificación, agenda, checklist y registro de paseos, generación de reportes para WhatsApp, registro de cobros y comisiones.

**Fuera (explícitamente):** app/portal de tutores, pasarela de pago integrada, GPS en tiempo real y registro audiovisual (plan ELITE), gestión del seguro canino, notificaciones automáticas por WhatsApp API (en v1 el envío al tutor es manual copia-pega; el reporte queda registrado y visible para el admin), multi-empresa/franquicia.

## Visión

Si la fase de prueba funciona: portal de tutores sin fricciones (agendar, pagar con un clic, ver el paseo con GPS y fotos según plan), pasarela de pagos integrada, y la capacitación Labradog como producto en sí mismo — certificar paseadores externos y licenciar el método. En 2-3 años, Labradog deja de ser un servicio de paseos con buen método y pasa a ser **el estándar de paseo profesional certificado**, con la plataforma como barrera de entrada real.
