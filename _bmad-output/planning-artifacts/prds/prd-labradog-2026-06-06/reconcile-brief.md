# Reconciliación Brief ↔ PRD — Plataforma Labradog

**Fecha:** 2026-06-06
**Revisor:** auditoría de consistencia
**Insumos (fuente de verdad):** `briefs/brief-labradog-2026-06-06/brief.md` + `addendum.md`
**Derivado auditado:** `prds/prd-labradog-2026-06-06/prd.md` + `addendum.md`

## Veredicto general

El PRD tiene **alta fidelidad** con el brief: cubre los 4 módulos, las reglas duras del método (checklist bloqueante FR-026, certificación bloqueante FR-016/017, ratio de perros FR-023, red flags FR-005, anexos legales FR-006, taxonomías del addendum), los precios, las fases y los criterios de éxito (sección 6). Las brechas que siguen son mayoritariamente **del eje cualitativo / de diferenciación del benchmark**, no del núcleo operativo. Ninguna es una contradicción numérica grave; son **omisiones silenciosas** de compromisos del brief que el formato de FRs dejó caer.

---

## 1. Compromisos del brief perdidos en el PRD

### 1.1 [ALTA] Especialidades de caminata (energética / senior / olfatoria) — sin FR
- **Brief (addendum, línea 34):** "Perfil de paseador visible con paseos realizados, calificaciones y **especialidades (tipo de caminata: energética, senior, olfatoria)** — calza con el método Labradog".
- **PRD:** No existe ningún FR que modele "tipo de caminata" ni "especialidad de paseador". El registro de paseo (FR-028) captura estado emocional y conductas, pero no clasifica el paseo por tipo, ni asocia especialidades al paseador, ni las usa para asignar (FR-023 valida solo certificación + horario + ratio).
- **Impacto:** Se pierde un diferenciador que el brief marcó como "calza con el método". Sin esto, la asignación es ciega al fit perro↔especialidad.
- **Recomendación:** FR nuevo — catálogo de tipos de caminata; campo de especialidades en el perfil de paseador; (opcional) sugerir tipo de caminata según perfil del perro.

### 1.2 [ALTA] Perfil de paseador visible + badge "Paseador Certificado Labradog" — diluido
- **Brief (addendum, líneas 34, 41):** "Perfil de paseador visible con paseos realizados, calificaciones y especialidades"; diferenciación = "Certificación real y **visible**: badge 'Paseador Certificado Labradog' con nivel/etapas".
- **PRD:** FR-016 otorga la certificación con fecha y evaluadores y "habilita" al paseador, pero la trata como **gate interno**, no como **perfil/credencial visible**. No hay FR para un perfil de paseador consultable (paseos realizados, nivel, badge, especialidades). Nota: en v1 el tutor no usa la plataforma, así que la visibilidad sería interna/admin — pero el brief la enmarca como activo de diferenciación que debe existir desde el modelo.
- **Impacto:** El badge/credencial — pieza central de la diferenciación vs "entrevista psicológica de WOF" — queda como dato suelto, no como entidad de perfil.
- **Recomendación:** FR de "perfil de paseador" que consolide certificación + nivel (60/70/80 ↔ certificado/100 paseos/senior) + paseos realizados + especialidades, y deje el badge como artefacto reutilizable post-prueba (cuando llegue el portal tutor).

### 1.3 [MEDIA] Reemplazo garantizado como *promesa/feature visible* — degradado a operación interna
- **Brief (addendum, línea 36):** "**Reemplazo garantizado como promesa visible** (Labradog ya lo hace informalmente — hacerlo feature)". También WOF: "Reemplazo automático de paseador sin costo al tutor" (línea 29).
- **PRD:** FR-021 permite "reasignarse a otro paseador (reemplazo)" como mecánica de agenda. Pero el brief pidió convertirlo en **feature/promesa** (garantía de cobertura), no solo en una acción de edición. No hay noción de "garantía de reemplazo", ni métrica de cobertura, ni tratamiento de huecos como SLA.
- **Impacto:** Pierde el encuadre de garantía que el brief quería como diferenciador; queda como tarea operativa.
- **Recomendación:** Elevar el reemplazo a promesa explícita (p.ej. todo paseo cancelado por falta de paseador genera alerta de cobertura priorizada; medir % de paseos cubiertos).

### 1.4 [MEDIA] Calificaciones del paseador — ausentes
- **Brief (addendum, línea 34):** perfil con "**calificaciones**" (qué imitar de WOF/Dogin que tienen 4.97★).
- **PRD:** No hay ningún FR de calificación/feedback de paseador. Coherente con "tutor no es usuario en v1" (no puede calificar), pero el brief lo listó como elemento a imitar y no se deja ni el placeholder de modelo de datos ni nota de "post-prueba".
- **Impacto:** Menor para v1, pero es un compromiso del brief que desaparece sin rastro (ni siquiera en "fuera de alcance" / visión).
- **Recomendación:** Declararlo explícitamente diferido (post-prueba, depende de portal tutor) para que no se pierda; o admitir calificación interna admin→paseador.

### 1.5 [BAJA] Certificado de capacitación: razas tratado como etapa extra
- **Brief (addendum, línea 16):** "9 etapas (~24-30 hrs) + módulo razas (4-6 hrs)" con tests en etapas 1,2,3,5; examen final etapa 9.
- **PRD:** FR-010/011/016 manejan "9 etapas + módulo de razas" correctamente y FR-011 dice "el módulo de razas se rinde después de la etapa 9". Consistente. **Sin brecha** — se anota solo para confirmar cobertura.

### 1.6 [BAJA] Segmento B2B / plan empresa — correctamente parqueado
- **Brief (addendum, líneas 38, 29):** "Segmento B2B corporativo (plan empresa) — parquear para visión".
- **PRD:** No aparece, lo cual es correcto (es visión). El brief lo manda parquear y el PRD lo omite sin contradecirlo. **Sin brecha**, pero el PRD no lo menciona ni en "Visión" — conviene un guiño para no perderlo.

---

## 2. Contradicciones brief ↔ PRD (números, fases, alcance, precios)

### 2.1 [REVISAR] "2 paseadores" vs "3-4 paseadores activos requeridos"
- **Brief (addendum, líneas 7-9):** la fase de prueba **requiere 3-4 paseadores activos** (hoy 2 + Nelson); por eso hay que formar más.
- **PRD:** Mezcla ambos sin contradicción dura: usa "2 actuales → 4+ en prueba" (sección 2) y "3-4 paseadores certificados" (sección 1). Pero el **criterio de éxito #1** del brief y el PRD hablan solo de "los 2 paseadores actuales certificados". 
- **Estado:** No es contradicción, pero el PRD podría aclarar que certificar a los 2 actuales es el hito mínimo, mientras la operación de 30 tutores (criterio #3) **exige 3-4** — formar al 3.º/4.º es trabajo de capacitación que el PRD cubre (FR-010+) pero no fija como meta de la prueba.
- **Acción:** Aclaración, no corrección.

### 2.2 [OK] Precios — consistentes
- Brief addendum (línea 14): BASE $10.000/hr (2×$18.000), PLUS $12.000/hr (2×$20.000), ELITE $15.000/hr+seguro (2×$25.000).
- PRD FR-034: idénticos. **Sin contradicción.**

### 2.3 [OK] Comisión 60-80% — consistente y mejor especificada
- Brief addendum (línea 15) deja el rango "por definir". PRD FR-036 + addendum lo resuelve (fijo por paseador con defaults por nivel 60/70/80, % congelado por paseo). **Coherente; el PRD avanza la decisión, no la contradice.**

### 2.4 [OK] Fases y semanas — consistentes
- Brief: Fase A semanas 1-4 (Capacitación + Agenda), Fase B semanas 5-8 (Registro + Cobros).
- PRD sección 7: idéntico. **Sin contradicción.**

### 2.5 [OK] Ratio de perros — consistente
- Brief addendum (línea 10): 1 paseador : 1-2 perros (hasta 3 mismo tutor compatibles, solo BASE).
- PRD FR-008/023: idéntico. **Sin contradicción.**

### 2.6 [MENOR] Seguro ELITE: fuera de alcance vs aparece en precio
- Brief: seguro canino "fuera (explícitamente)". PRD lo excluye (sección 1) pero FR-034 lista "ELITE $15.000/hr" sin el "+ seguro". Coherente con dejar el seguro fuera, pero el reporte ELITE (addendum PRD) y el plan ELITE quedan parcialmente vacíos (GPS/video/seguro post-v1). **Sin contradicción**, solo confirmar que ELITE en v1 es "ELITE sin sus extras".

---

## 3. Ideas cualitativas del brief que la estructura de FRs dejó caer

### 3.1 [MEDIA] Transparencia de precios y comisiones como diferenciador — parcial
- **Brief (addendum, líneas 43, 41):** "Transparencia de precios y comisiones (WOF las oculta)" como diferenciación.
- **PRD:** FR-038 captura la mitad (paseador ve sus comisiones — "transparencia vs marketplaces"). La transparencia de **precios hacia el tutor** no aplica en v1 (tutor no es usuario), pero la idea-diferenciador no se nombra como principio de producto. Queda implícita.
- **Recomendación:** Anotar como principio (aunque su materialización plena sea post-prueba con portal tutor).

### 3.2 [MEDIA] Reporte conductual como diferenciador ("vs foto+distancia del mercado") — presente pero sin encuadre
- **Brief (addendum, línea 42):** diferenciación = "Reporte post-paseo **conductual** (estado emocional, olfateo, interacciones, energía pre/post) vs 'foto + distancia' del mercado".
- **PRD:** FR-028/031 capturan estado emocional, conductas, pipí/caca. **Bien cubierto funcionalmente.** Pero el brief lo enmarca como *el* diferenciador frente a Dogin ("foto + distancia"); el PRD lo trata como campos de registro, sin declarar la intención de superioridad cualitativa del reporte. "Energía pre/post" del brief no está explícito (FR-028 dice estado emocional, no delta pre/post).
- **Recomendación:** Considerar capturar energía pre vs post (delta), que es justo lo que el brief destaca.

### 3.3 [MEDIA] Tono / experiencia "básica y sin fricciones", honestidad del moat — no traspasado como principio
- **Brief (cuerpo, líneas 43, 37) + addendum (línea 24):** "Honestidad sobre el moat: no hay moat tecnológico; la ventaja es el método + velocidad IA-first"; experiencia tutor futura "básica, eliminar fricciones"; equipo certificado "consistencia como promesa" (no marketplace de freelancers).
- **PRD:** NFR-01 recoge "simplicidad / <2 min en la calle" (buena bajada de "sin fricciones" para el paseador). Pero el posicionamiento — "equipo certificado con estándar, no marketplace" y "consistencia como promesa" — no aparece como principio rector. Es lo que justifica varias decisiones (gate de certificación, perfil con badge).
- **Recomendación:** Una línea de "principios de producto / posicionamiento" en el contexto del PRD que ancle las decisiones a la diferenciación del brief.

### 3.4 [BAJA] "Capacitación Labradog como producto" / licenciar el método — visión
- **Brief (cuerpo, línea 67):** visión de certificar paseadores externos y licenciar el método.
- **PRD:** No lo menciona (correcto, es visión 2-3 años). Pero como el módulo de Capacitación se está construyendo igual, valdría una nota de "diseñar el módulo sin acoplarlo a 'paseadores internos' para no cerrar la puerta a externos". **Sugerencia de arquitectura, no brecha.**

---

## Resumen priorizado de brechas

| # | Brecha | Severidad | Referencia brief | Estado en PRD |
|---|---|---|---|---|
| 1 | Especialidades/tipos de caminata (energética/senior/olfatoria) sin FR | ALTA | addendum L34 | Ausente |
| 2 | Perfil de paseador visible + badge "Certificado Labradog" diluido a gate interno | ALTA | addendum L34, L41 | FR-016 parcial |
| 3 | Reemplazo garantizado como promesa/feature, no como acción de agenda | MEDIA | addendum L36 | FR-021 parcial |
| 4 | Calificaciones de paseador desaparecen sin nota de diferimiento | MEDIA | addendum L34 | Ausente |
| 5 | Diferenciadores cualitativos (transparencia, reporte conductual superior, "equipo certificado no marketplace") no anclados como principios | MEDIA | addendum L41-44 | Implícito |

**Sin contradicciones numéricas/de fase/precio.** Las brechas son de **diferenciación y posicionamiento** del benchmark WOF, no del núcleo operativo (que está bien trasladado).
