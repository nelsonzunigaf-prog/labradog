# Labradog — Propuesta de Plataforma
## Documento para socios · Junio 2026 · v2 (incluye diseño de solución)

---

## 1. Resumen ejecutivo

Labradog es un servicio profesional de paseo de perros con algo que nadie más tiene en el mercado chileno: un **método propio escrito y probado** — programa de capacitación de 9 etapas con certificación, protocolos de seguridad obligatorios, y tres planes de servicio definidos (BASE / PLUS / ELITE).

Hoy ese método tiene un techo: vive en WhatsApp, planillas y la cabeza del fundador, lo que limita la operación a ~10 perros. La propuesta es construir la **Plataforma Labradog** — el sistema de gestión que convierte el método en software — para escalar a una **fase de prueba con 30 tutores y 3-4 paseadores certificados** en un horizonte de 2 meses, como paso previo al lanzamiento público.

No se trata de construir "otra app de paseos". Se trata de digitalizar un negocio que ya funciona, con un diferenciador validado contra el mercado: **certificación profesional real, donde la competencia solo hace filtros de selección.**

## 2. El problema y la oportunidad

**El problema interno:** la operación es artesanal. Agenda mental, reportes manuales, cobros perseguidos uno a uno, comisiones calculadas a mano. El fundador es el único punto de falla y el crecimiento está congelado.

**La oportunidad de mercado:** el mercado chileno de paseo de perros está en plena efervescencia (WOF, Dogin, Wagg, Snup), pero todos compiten como **marketplaces**: conectan oferta y demanda, validan antecedentes, y compiten por precio o volumen. **Ninguno capacita técnicamente a sus paseadores.** El segmento de tutores que quiere estándar profesional — no el paseador más cercano ni el más barato — no tiene oferta hoy.

**El cuello de botella es la capacitación:** 30 tutores ≈ 60-90 paseos/semana ≈ 3-4 paseadores activos. La regla del método es estricta: nadie pasea sin certificarse. Por eso la plataforma parte por capacitación, no por agenda.

## 3. Propuesta de valor

**Para el tutor** (persona con poco tiempo):
> "Tu perro sale con un paseador certificado en un método profesional — no con un desconocido con buenas reseñas. Recibes un reporte real de cómo estuvo tu perro, no solo una foto."

- Paseadores certificados en 9 etapas: manejo de riesgo, lectura del perro, emergencias, entorno urbano
- Reporte conductual post-paseo (estado emocional, energía, incidentes) — no solo "foto + distancia"
- Reemplazo garantizado: el servicio no falla por la agenda de una persona
- Respaldo legal y ético: anexos de límites del servicio conforme a Ley 21.020, seguro canino en plan ELITE

**Para el paseador:**
- Formación profesional certificada (un activo para su carrera, gratuito al integrarse)
- Comisión transparente del 60-80% — los marketplaces ocultan sus márgenes
- Agenda, registros y liquidaciones en un solo lugar

**Para el negocio (los socios):**
- El estándar deja de depender del fundador → operación delegable y escalable
- Trazabilidad total: cada paseo con checklist, registro y reporte visible para el administrador
- El método como activo: a futuro, la capacitación Labradog es licenciable como producto en sí misma

## 4. Benchmark: dónde juega Labradog

Investigación de mercado (junio 2026, fuentes: EMOL, The Clinic, sitios oficiales):

| | **Labradog** | **WOF** | **Dogin** | **Wagg** |
|---|---|---|---|---|
| **Modelo** | Equipo propio certificado | Marketplace verificado | Marketplace de volumen | Marketplace |
| **Selección del paseador** | Capacitación 9 etapas + certificación + examen | Entrevista + validación psicológica | Reviews de usuarios | Verificación básica |
| **Capacitación técnica** | ✔ Programa formal propio | ✘ No tiene | ✘ No tiene | ✘ No tiene |
| **Reporte al tutor** | Conductual profesional | GPS + básico | Foto + distancia | Básico |
| **Precio paseo** | $10.000–15.000 | Medio-premium (no público) | Desde $5.000 | Medio |
| **Seguro canino** | ✔ Plan ELITE | ✘ | ✘ | ✘ |
| **Transparencia comisiones** | ✔ 60-80% público | ✘ No publica | — | — |
| **Tracción** | 7-10 perros (pre-plataforma) | Sin cifras públicas | 17.800+ usuarios, 4.97★ | Autodeclarada #1 |

**Lo que imitamos de WOF** (recomendación del socio, validada): perfil de paseador con calificaciones y especialidades de caminata, notificación al recoger al perro, reemplazo garantizado como promesa visible, perfil rico del perro al ingresar, y su apuesta B2B (planes empresa) como línea futura.

**Lo que no imitamos:** competir por precio contra Dogin ($5.000) ni por volumen como marketplace. Labradog compite por estándar — el espacio que nadie ocupa.

## 5. La solución: plataforma en dos fases (2 meses)

Aplicación web interna (responsive, uso en celular), dos roles: administrador y paseador. El tutor **no usa la plataforma en v1** — sigue en WhatsApp, donde ya está cómodo; su portal llega post-prueba.

**Fase A — Capacitar y agendar (semanas 1-4):**
- **Capacitación:** las 9 etapas + módulo de razas digitalizadas, tests por etapa, banco de 100 preguntas, registro de avance y certificación. Los 2 paseadores actuales son los primeros certificados.
- **Agenda:** calendario de paseos (perro, tutor, paseador, plan, horario), asignaciones y reemplazos.

**Fase B — Registrar y cobrar (semanas 5-8):**
- **Registro:** checklist pre-paseo obligatoria (el paseo no parte sin completarla), registro del paseo, generación del reporte para WhatsApp. Historial completo visible para el administrador por perro, tutor y paseador.
- **Cobros:** registro de pagos (transferencia), cálculo automático de comisiones 60-80%, estados de cuenta.

**Explícitamente fuera de v1:** portal de tutores, pasarela de pago integrada, GPS en vivo y registro audiovisual (ELITE), WhatsApp automático, gestión del seguro.

## 6. Modelo de negocio

| Plan | Precio/hora | 2 horas | Incluye |
|---|---|---|---|
| **BASE** | $10.000 | $18.000 | Paseo estructurado 45-60 min, chequeo, reporte WhatsApp |
| **PLUS** | $12.000 | $20.000 | BASE + estimulación mental, refuerzo de comandos, fotos |
| **ELITE** | $15.000 | $25.000 | PLUS + paseo a medida, GPS, registro audiovisual, **seguro canino** |

Comisión del paseador: **60-80%** del valor del paseo. Margen Labradog: 20-40% + a futuro, valor del método (capacitación licenciable, planes empresa).

## 7. Fase de prueba: metas y criterios de éxito

1. **2 paseadores actuales certificados** en la plataforma dentro del primer mes
2. **100% de los paseos** con checklist y registro completados (hoy: 0%)
3. **30 tutores** operando sin planillas: agenda, registros y comisiones en la plataforma
4. Cierre de comisiones en **minutos, no horas**, sin errores
5. **El fundador puede tomar vacaciones** con la operación corriendo

## 8. Cómo se construye

Modalidad **IA-first**: Nelson lidera y supervisa el desarrollo (delivery manager, profesión informática); la construcción la ejecuta IA (Claude Code) bajo el proceso BMAD (brief → PRD → arquitectura → desarrollo iterativo). Esto permite el plazo de 2 meses **sin contratar desarrolladores** y con costo de infraestructura mínimo.

**Estado actual:** ✅ brief validado → ✅ requisitos detallados (PRD: 40 requisitos funcionales, doble revisión de calidad) → ✅ **diseño de solución completo y validado** (sección 9). Próximo hito: plan de construcción (épicas y stories) e inicio del desarrollo.

## 9. Diseño de la solución

El diseño técnico está terminado y auditado (validación independiente: cobertura del 100% de los requisitos, veredicto "listo para implementación"). Lo esencial para la decisión de negocio:

### Qué es técnicamente

Una **aplicación web** (sin app que instalar): los paseadores la usan desde el navegador del celular en la calle; los admins desde el computador. Dos perfiles de acceso — administrador (Nelson + socios) y paseador — cada uno ve solo lo suyo.

### El método Labradog como regla de software, no como sugerencia

La decisión de diseño más importante: las reglas del método **las hace cumplir el sistema**, no la buena memoria de las personas.

- La checklist pre-paseo **bloquea** el inicio del paseo: sin checklist completa, el paseo no puede partir — incluso sin señal de celular (la app funciona offline y sincroniza al volver la conexión)
- Un paseador **no certificado no puede recibir paseos**: el sistema lo impide, no hay excepción manual
- Los precios y comisiones de cada paseo quedan **congelados al momento del paseo**: un cambio de tarifa nunca altera lo ya pagado o liquidado — historia contable intocable
- **Todo queda registrado con autor y fecha**: cada evaluación, pago, cambio de agenda e incidente es trazable — el respaldo profesional que el método exige

### Costo y riesgo operativo

| Concepto | Valor |
|---|---|
| Infraestructura mensual | **~$5-7 USD/mes** (≈ $5.000-7.000 CLP) |
| Desarrollo | $0 en sueldos (IA-first, supervisado por Nelson) |
| Respaldos | Automáticos diarios (la base de datos gestionada los incluye) |
| Dependencias críticas de terceros | **Cero** en v1 (sin pasarelas, sin APIs externas) |
| Datos personales | Conforme Ley 19.628: mínimos necesarios, sin compartir con terceros |

El stack elegido (Next.js + Postgres) es **el más usado y documentado del mercado**: cualquier desarrollador o IA puede mantenerlo — el proyecto no queda cautivo de nadie.

### Preparado para crecer

El diseño deja listas las bases para el post-prueba sin rehacer nada: portal de tutores (agendar y pagar online), botón de pago (Webpay/MercadoPago), reportes automáticos por WhatsApp, GPS del plan ELITE. Los motores de negocio (agenda, cobros, certificación) se construyen separados de las pantallas precisamente para eso.

### Plan de construcción (2 meses)

| Fase | Semanas | Entrega |
|---|---|---|
| A | 1-4 | Acceso y fichas + **Capacitación** (las 9 etapas digitalizadas, tests, certificación) + **Agenda** |
| B | 5-8 | **Registro de paseos** (checklist, reportes) + **Cobros y comisiones** (todas las modalidades) |

## 10. Qué sigue / conversación con los socios

- Validar esta propuesta de valor y el alcance de la fase de prueba
- **Ratificar el esquema de comisiones** propuesto: % por paseador con default por nivel (60% recién certificado → 70% tras 100 paseos sin incidentes graves → 80% senior/evaluador)
- Definir el plan de reclutamiento: 1-2 paseadores adicionales para llegar a 3-4 certificados
- Estrategia de captación de los 30 tutores de prueba (red actual + referidos)
- Decisión posterior: proveedor de botón de pago (Webpay / MercadoPago / Flow) para el lanzamiento público

---

*Documento generado a partir del Product Brief, PRD y Diseño de Solución Labradog (06-06-2026), más benchmark de mercado. Detalle técnico completo en `_bmad-output/planning-artifacts/`.*
