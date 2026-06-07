# Addendum — Brief Plataforma Labradog

Detalle que no cabe en el brief pero alimenta el PRD y la arquitectura.

## Dimensionamiento de capacidad (base de los criterios de éxito)

- 30 tutores × 2-3 paseos/semana = 60-90 paseos/semana
- 1 paseador full-time ≈ 4-6 paseos/día ≈ 25-30/semana
- → Se requieren **3-4 paseadores activos** para la fase de prueba (hoy hay 2 + Nelson)
- Ratio operativo del método: 1 paseador : 1-2 perros (hasta 3 si son del mismo tutor y compatibles, solo plan BASE)

## Reglas de negocio para el PRD (fuente: `archivos del proyecto\`)

- **Planes:** BASE $10.000/hr (2× $18.000) · PLUS $12.000/hr (2× $20.000) · ELITE $15.000/hr + seguro (2× $25.000). CLP.
- **Comisión paseador:** 60%-80% del valor del paseo (rango por definir en PRD: ¿fijo por paseador, por antigüedad, por plan?).
- **Capacitación:** 9 etapas (~24-30 hrs) + módulo razas (4-6 hrs). Tests por etapa (etapas 1,2,3,5), ejercicios (etapa 4), casos (etapa 6), plantillas (etapas 7,8), banco de 100 preguntas para examen final (etapa 9). Certificado: "Paseador de Perros Profesional - Entorno Urbano".
- **Flujo operativo obligatorio:** entrevista inicial con tutor (con red flags: 2+ → evaluar rechazo) → checklist pre-paseo (bloquea inicio) → registro durante/post → reporte al tutor → registro de incidentes inmediato.
- **Anexos legales** a vincular a cada tutor: documento de aceptación de límites del servicio + compromiso ético (Ley 21.020).

## Opciones consideradas y aparcadas

- **Botón de pago (post-prueba):** candidatos Chile — Webpay Plus (Transbank), MercadoPago, Flow, Khipu. Evaluar en arquitectura por comisiones y facilidad de integración.
- **WhatsApp API (post-prueba):** envío automático de reportes vía WhatsApp Business API o Twilio; en v1 el reporte se genera en la plataforma y se envía copia-pega manual.
- **App tutor (post-prueba):** requisito de diseño cuando llegue — "vista básica, eliminar fricciones en el acceso" (cliente con poco tiempo). Considerar magic links / sin contraseña.
- **GPS + registro audiovisual:** exclusivos del plan ELITE; requieren app móvil del paseador con tracking — fuera del MVP web.

## Benchmark de mercado — WOF y competidores (jun-2026)

Referencia sugerida por un socio: **WOF (wearewof.com / wofpets.cl)** — marketplace chileno de paseadores verificados (fundadora Adriana Jeanneret), foco RM + V Región. Diferenciador: selección con entrevistas y validación psicológica; **sin capacitación técnica formal** (vacío que Labradog llena con sus 9 etapas). Reemplazo automático de paseador sin costo al tutor. Línea B2B en desarrollo (beneficio para empleados). Comisiones y precios no públicos.

Otros actores: **Dogin** (17.800+ usuarios, 4.97★, desde $5.000, GPS robusto y reporte con distancia), **Wagg** (primer paseo gratis, instantaneidad), **Wolkie** (2017, $3.000-10.000).

**Qué imitar de la experiencia:**
- Perfil de paseador visible con paseos realizados, calificaciones y especialidades (tipo de caminata: energética, senior, olfatoria) — calza con el método Labradog
- Notificación al recoger al perro + GPS + reporte post-paseo (en Labradog: v1 genera reporte, GPS post-prueba/ELITE)
- Reemplazo garantizado como promesa visible (Labradog ya lo hace informalmente — hacerlo feature)
- Onboarding del perro con perfil rico (foto, raza, edad, comportamiento) — en Labradog esto es la entrevista inicial digitalizada
- Segmento B2B corporativo (plan empresa) — parquear para visión

**Qué hacer distinto (diferenciación):**
- Certificación real y visible: badge "Paseador Certificado Labradog" con nivel/etapas vs entrevista psicológica de WOF
- Reporte post-paseo conductual (estado emocional, olfateo, interacciones, energía pre/post) vs "foto + distancia" del mercado
- Transparencia de precios y comisiones (WOF las oculta)
- Equipo certificado con estándar, no marketplace de freelancers — consistencia como promesa

Fuentes: EMOL (may-2026), Publimicro, wofpets.cl, The Clinic (jun-2026), dogin.cl, wagg.me.

## Contexto de desarrollo

- Modalidad IA-first: Nelson supervisa (delivery manager), Claude Code desarrolla bajo proceso BMAD.
- Implicancia para arquitectura: stack mainstream, bien documentado y de baja mantención; costo de infra mínimo (operación de ~$1-3M CLP/mes de ingresos no justifica infra cara).
