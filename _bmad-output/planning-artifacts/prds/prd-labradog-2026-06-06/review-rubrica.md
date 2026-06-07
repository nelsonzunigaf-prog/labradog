# Revisión de Calidad del PRD — Plataforma Labradog (Fase de prueba)

Fecha de revisión: 2026-06-06
Revisor: validador de PRDs (rúbrica BMAD)
Stakes acordados: herramienta interna con miras a lanzamiento — rigor medio, no investor-grade. El PRD alimenta directamente arquitectura → desarrollo.

## Veredicto general

**Apto con correcciones.** El PRD es coherente, con tesis clara (digitalizar el método propietario de Labradog para que la trazabilidad y la certificación dejen de vivir en WhatsApp/planillas), buen ajuste de forma (spec de capacidades para herramienta interna de 2 roles, sin sobrecarga de UJs) y métricas con contramétricas genuinas. Es de los PRDs honestos: nombra lo que difiere, lo que queda fuera y lo que está pendiente. Lo que está en riesgo es la **claridad de "done" en reglas de negocio cruzadas** — varios FRs del núcleo económico (cobros, comisiones, cancelaciones, precios por duración) tienen huecos o tensiones que, sin resolver, obligarán al arquitecto a inventar reglas de negocio. No son fallas de redacción: son decisiones de producto no tomadas. Con 4-5 correcciones puntuales el PRD queda listo para arquitectura.

---

## Dimensión 1 — Preparación para decidir (Decision-readiness): adecuado

Las decisiones se presentan como decisiones, no enterradas. La sección 8 distingue bien lo resuelto (política de cancelación, nota mínima, reintentos) de lo abierto (esquema de comisiones, planilla actual) con owner y fecha de revisión. Las contramétricas (sección 6) son reales y combaten atajos concretos (checklist marcada sin hacerse, examen trivial). El addendum nombra trade-offs explícitos (opciones A/B/C de comisión con pro/contra). Esto es trabajo honesto.

Lo que falta surfacear como decisión: el manejo de la **excepción de transición** (FR-017, paseadores "habilitados en certificación") y su ciclo de vida — ver hallazgo en Dimensión 4. Y la relación precio/duración (FR-034) está presentada como tabla de tarifas sin la regla de cálculo, que es una decisión de negocio no tomada.

### Hallazgos
- **media** Ciclo de vida del estado "habilitado en certificación" no decidido (§4, FR-017) — Se define la excepción de transición ("primer mes") pero no qué pasa al vencer el mes si el paseador no completó el programa: ¿se le quitan los paseos asignados? ¿se bloquea? ¿queda a criterio del admin? Es una decisión de producto, no de arquitectura. *Fix:* añadir una frase con la regla de expiración (p.ej. "al vencer el plazo sin certificar, el admin debe recertificar la habilitación o el sistema bloquea nuevas asignaciones").

---

## Dimensión 2 — Sustancia sobre teatro: fuerte

Poco relleno. No hay teatro de personas (los 3 recorridos de la sección 3 tienen protagonista nombrado y cada uno ilustra un rol/flujo real, no decoran). No hay teatro de innovación: el diferenciador citado (transparencia de comisiones vs marketplaces, FR-038) es plausible y acotado, no inflado. Los NFR tienen umbrales específicos del producto: < 2 min para completar flujos del paseador en la calle (NFR-01), < $20 USD/mes (NFR-06), respaldo diario (NFR-05) — no son boilerplate de "debe ser escalable/seguro". El NFR-05 incluso justifica el por qué ("pérdida de registros = pérdida del respaldo profesional ante incidentes"). Bien.

Sin hallazgos materiales.

---

## Dimensión 3 — Coherencia estratégica: fuerte

Hay tesis y las features la sirven. El arco es claro: el método de Labradog (9 etapas, protocolos, taxonomías) es el activo; la plataforma existe para hacer cumplir ese método con trazabilidad (NFR-04: "el método vive de la trazabilidad"). La priorización por fases sigue la tesis, no la facilidad: Fase A entrega certificación + agenda (sin paseadores certificados no hay operación), Fase B entrega el registro y el cobro. Las métricas validan la tesis (certificación, 100% checklist, salir de planillas), no actividad vacía. El alcance MVP es del tipo "problem-solving / operacional" y la lógica de scope calza.

Sin hallazgos materiales.

---

## Dimensión 4 — Claridad de "done" (Done-ness): delgado

Esta es la dimensión más débil y la razón del veredicto "con correcciones". La mayoría de los FRs tienen consecuencia testeable (FR-011 desbloqueo secuencial, FR-012 80%/ilimitados, FR-026 "no pasa a en curso sin checklist completa" — esto es excelente, un estado de máquina verificable). Pero el **núcleo económico** tiene reglas de negocio incompletas que bloquearán la implementación porque obligan a inventar.

### Hallazgos

- **crítico** Regla de cálculo precio↔duración no definida (§4, FR-034) — La tabla mezcla tarifas por hora (BASE $10.000/hr…) y tarifas fijas por 2 hrs ($18.000…), pero FR-019 define la duración del paseo como atributo libre de la recurrencia. No hay regla para duraciones distintas de 1 o 2 horas (¿45 min? ¿90 min?), ni se dice si el precio es por hora prorrateada o por tramos fijos. Sin esto, "el sistema calcula lo cobrable" (FR-034) y la liquidación de comisiones (FR-037, que multiplica por "tarifa") son no implementables. *Fix:* definir si el precio es por tramo fijo (1h / 2h) con duraciones permitidas cerradas, o por hora prorrateada; declarar las duraciones válidas.

- **crítico** Saldo de prepago sin FR que lo soporte (§4 FR-033/FR-034; addendum "Modalidades de cobro") — El addendum reconoce que prepago "implica saldo/paquete: paseos contratados vs consumidos (control de saldo restante y aviso de agotamiento al admin)", pero ningún FR del cuerpo crea ese concepto. FR-034 menciona "o contratados, si prepago" de pasada. No hay FR para: registrar el paquete contratado, descontar por paseo consumido, ni avisar agotamiento. El addendum dice que no es parte del cuerpo del PRD — entonces una capacidad real (1 de las 6 modalidades obligatorias de FR-033) queda sin requisito. *Fix:* añadir un FR de gestión de saldo prepago (contratar paquete, descontar consumo, alertar agotamiento) o declarar explícitamente prepago como fuera de v1.

- **alto** Estado de paseos cancelados frente al cobro y la comisión no resuelto (§4, FR-022 ↔ FR-034 ↔ FR-037) — FR-022 marca la cancelación mismo-día como "cobrable", pero FR-034 calcula lo cobrable "según paseos **realizados**" y FR-037 liquida "paseos **completados**". Un paseo cancelado-cobrable no está realizado ni completado: ¿entra al cobrable del tutor? ¿genera comisión del paseador o no (no hubo paseo)? Es un estado contradictorio entre tres FRs. *Fix:* definir explícitamente que un cancelado-cobrable suma al cobrable del tutor pero (decisión) no genera comisión, o la regla que aplique; ajustar el texto de FR-034/FR-037 para no decir solo "realizados/completados".

- **alto** Ambigüedad: ¿el plan es del tutor o del paseo? (§4, FR-004 ↔ FR-019 ↔ FR-031) — FR-004 fija el plan como dato de la ficha del tutor ("plan, modalidad de cobro"); FR-019 lo incluye como atributo de la recurrencia del paseo; FR-031 formatea el reporte "según plan". Si un tutor con plan PLUS puede tener una recurrencia BASE, el modelo y los precios divergen. No se dice si el plan es único por tutor o por recurrencia/perro. *Fix:* declarar el nivel de granularidad del plan (recomendado: por recurrencia/perro, con el de la ficha como default), para que precio y formato de reporte se deriven sin ambigüedad.

- **media** Paseos grupales multi-tutor sin definir (§4, FR-023 ↔ FR-008) — FR-023 fija ratio 1-2 perros por paseo, "hasta 3 si son del mismo tutor y compatibles". No se contempla agrupar perros de **tutores distintos** en un paseo. Para un negocio de paseo esto suele ser central (eficiencia del paseador), y la asignación de comisión/cobro de un paseo con 2 perros de 2 tutores no está cubierta. Puede ser intencional (cada perro = un paseo). *Fix:* declarar explícitamente como Non-Goal v1 ("solo paseos de un mismo tutor") o definir cómo se reparte cobro/comisión en grupo mixto.

- **media** "Sin tope de horario con otro paseo suyo" sin parámetro de buffer (§4, FR-023) — La validación de solape no contempla tiempo de traslado entre paseos (retiro en direcciones distintas). Dos paseos contiguos sin buffer producen una agenda imposible en la práctica. *Fix:* definir si hay margen de traslado configurable o si la validación es solo de solape estricto (decisión explícita).

- **baja** "Compatibilidad entre perros" sin formato definido (§4, FR-008) — Se registra "compatibilidad" pero no se dice si es booleano por par, escala, o nota libre. Afecta la validación automática de FR-023. *Fix:* especificar el tipo de dato mínimo (p.ej. compatible/no-compatible por par de perros del tutor).

---

## Dimensión 5 — Honestidad de alcance: adecuado

Las omisiones son mayormente explícitas. La sección 1 lista "lo que no cubre" (portal tutor, pasarela, GPS, WhatsApp API, seguro ELITE) y el addendum repite los post-prueba. La excepción de transición (FR-017) se nombra en vez de asumirse. Densidad de ítems abiertos baja (2 preguntas abiertas, ambas con owner) — apropiada para una herramienta interna con luz verde a construir.

Falta honestidad explícita en dos puntos que el lector podría asumir silenciosamente: el prepago (ver Dim. 4, crítico — está a medias entre "soportado" y "fuera") y los paseos grupales multi-tutor (ver Dim. 4 — ni incluido ni declarado Non-Goal). No hay sección de Non-Goals formal; para este nivel de stakes no es obligatoria, pero los dos puntos anteriores se beneficiarían de un callout `[NON-GOAL v1]` o un FR.

### Hallazgos
- **media** Sin marcado explícito de Non-Goals en zonas asumibles (§1, §4) — Prepago y grupos multi-tutor quedan en zona gris (ver hallazgos crítico/media en Dim. 4). *Fix:* una mini-sección de Non-Goals v1 o callouts puntuales resuelve ambos de una vez.

---

## Dimensión 6 — Usabilidad downstream: adecuado

Este PRD es chain-top (alimenta arquitectura), así que la traza importa. IDs de FR contiguos y únicos (FR-001 a FR-038, sin saltos ni duplicados detectados). NFR-01 a NFR-07 ídem. Las taxonomías del método están centralizadas en el addendum (estados emocionales, tipos de incidente, grupos de raza, red flags, checklist) y se referencian desde los FRs — esto es muy útil para el modelo de datos. Los cross-refs internos resuelven (FR-017 desde FR-023, FR-008 desde FR-023, NFR-04 desde sección 2).

Brecha menor: no hay **glosario** formal de sustantivos de dominio. Términos como "plan", "modalidad de cobro", "cobrable", "realizado/completado", "habilitado en certificación" se usan con sentido variable (ver Dim. 4) — un glosario los fijaría. Para este stakes no es bloqueante, pero las inconsistencias de "plan" y "realizado vs completado" sí lo son y se resuelven mejor con definición única.

### Hallazgos
- **baja** Sin glosario; términos económicos con uso variable (todo el §4) — "realizado" (FR-034) vs "completado" (FR-037) vs estado "completado" (FR-025) deberían ser un solo término definido. *Fix:* glosario corto o nota que unifique los estados del paseo (pendiente/en curso/completado/cancelado-cobrable/cancelado-no-cobrable) y los reutilice en FR-034/037.

---

## Dimensión 7 — Ajuste de forma (Shape fit): fuerte

Forma correcta para el producto. Es una herramienta interna de 2 roles operativos → spec de capacidades, no producto de consumo. Acertadamente **no** infla UJs: la sección 3 da 3 recorridos como resumen con protagonista nombrado (Tomás, Carla, Nelson) sin formalizarlos en UJs con IDs, lo cual sería overhead aquí. Las métricas son operacionales (certificación, % checklist, salir de planillas), no user-facing de consumo — correcto para tool interno. El rigor es medio y consistente con el stakes declarado. No está ni sobre-formalizado ni sub-formalizado.

Sin hallazgos.

---

## Notas mecánicas

- **Continuidad de IDs:** FR-001…FR-038 y NFR-01…NFR-07 contiguos y únicos. Sin gaps ni duplicados.
- **Cross-refs:** todos los `(FR-0xx)` y `(NFR-0x)` citados resuelven a un FR/NFR existente. Correcto.
- **Addendum vs cuerpo:** el addendum dice "no forma parte del cuerpo del PRD" pero contiene reglas de negocio que el cuerpo necesita para ser implementable (saldo prepago, congelado de precio por paseo, formato de reportes). Riesgo: el arquitecto podría tratarlo como opcional. *Recomendación:* promover al cuerpo del PRD (o referenciar como normativo) al menos: control de saldo prepago, regla de congelado de precio/comisión por paseo, y la regla precio↔duración una vez decidida.
- **Taxonomías:** bien centralizadas en el addendum; consistentes con las menciones en FR-028 (estados emocionales) y FR-029 (tipos de incidente). El FR-005 cita red flags coherentes con el addendum.
- **Deriva de glosario:** "ansiedad" (FR-028) vs "ansiedad-miedo" (addendum) — drift menor de etiqueta en la taxonomía de estados emocionales. Unificar.
- **Tarifas:** la tabla de FR-034 ($10.000/$12.000/$15.000 por hr y $18.000/$20.000/$25.000 por 2 hrs) implica que 2 hrs no es 2× la hora (descuento). Confirma que es intencional al definir la regla precio↔duración (hallazgo crítico Dim. 4).

---

## Resumen de hallazgos por severidad

| Sev | FR/§ | Hallazgo |
|---|---|---|
| crítico | FR-034 | Regla precio↔duración no definida (mezcla tarifa/hr y tarifa fija 2h; duraciones libres en FR-019) |
| crítico | FR-033/034 | Saldo de prepago sin FR que lo soporte (capacidad obligatoria a medio definir) |
| alto | FR-022/034/037 | Estado cancelado-cobrable contradice "realizados/completados" en cobro y comisión |
| alto | FR-004/019/031 | Ambigüedad plan: ¿del tutor o del paseo/recurrencia? |
| media | FR-023/008 | Paseos grupales multi-tutor sin definir ni declarar Non-Goal |
| media | FR-017 | Ciclo de vida de "habilitado en certificación" al vencer el plazo |
| media | FR-023 | Validación de agenda sin buffer de traslado |
| media | §1/§4 | Sin Non-Goals explícitos en zonas asumibles |
| baja | FR-008 | Formato del dato "compatibilidad" no especificado |
| baja | §4 | Sin glosario; "realizado" vs "completado" / deriva "ansiedad-miedo" |

**Recomendación:** resolver los 2 críticos y los 2 altos antes de pasar a arquitectura (son decisiones de producto, no de ingeniería). Los de severidad media/baja pueden cerrarse en paralelo con el inicio de arquitectura.
