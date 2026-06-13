# Sprint Change Proposal — 2026-06-12

## 1. Resumen del problema

Las pantallas construidas (Epic 1 completo + 2.1/2.2) usan shadcn por defecto: sin identidad de marca, sin patrón de navegación consistente (faltan botones "volver"), aspecto genérico. Detectado por Nelson al probar la Story 2.2. Causa raíz: el proyecto nunca tuvo spec de UX y las épicas se escribieron 100% funcionales.

**Resolución previa a esta propuesta (misma fecha):** se creó el spec de UX con `bmad-ux` — `DESIGN.md` (identidad "Menta & Mar") y `EXPERIENCE.md` (app shell y navegación) en `_bmad-output/planning-artifacts/ux-designs/ux-labradog-2026-06-12/` — y se cableó la evaluación UX obligatoria en `create-story`/`dev-story`/`code-review` (`_bmad/custom/*.toml`). Falta la story que APLICA el spec a lo construido.

## 2. Análisis de impacto

- **Epic 2**: gana la Story 2.8 (8 stories en vez de 7). Las 2.3-2.7 no cambian de contenido; al ejecutarse después del rediseño, nacen sobre el shell nuevo (evita retrabajo).
- **Stories completadas (1.1-2.2)**: retrofit SOLO presentacional (tema + navegación). Cero cambios de comportamiento, schema o reglas.
- **PRD**: sin cambios (NFR-02 ya cubre móvil-primero; no hay FRs nuevos).
- **Arquitectura**: sin cambios adicionales (decisiones ya registradas).
- **Técnico**: globals.css (variables shadcn), layouts nuevos (`paseador/layout` con bottom-nav, `admin/layout` con nav), retoque de ~12 páginas. Riesgo principal: selectores/textos de los 14 E2E — se ajustan en la misma story.

## 3. Enfoque recomendado

**Ajuste directo** (sin rollback, sin tocar el MVP): insertar la Story 2.8 al Epic 2 con ejecución ANTES de la 2.3. Esfuerzo estimado: 1 story estándar (comparable a una ficha del Epic 1). Riesgo: bajo (presentacional + regresión E2E completa como red).

## 4. Propuestas de cambio detalladas

### 4.1 epics.md — agregar al final del Epic 2

```
### Story 2.8: App shell y rediseño Menta & Mar

> ⚠️ Orden de ejecución: esta story se ejecuta ANTES de la 2.3 (las stories
> restantes del epic nacen sobre el shell nuevo). Numerada 2.8 para no
> renumerar referencias existentes.

As a usuario de Labradog (admin o paseador),
I want que toda la plataforma tenga la identidad Menta & Mar y navegación consistente,
So that la herramienta refleja el cuidado de la marca y nunca quedo atrapado en una pantalla.

**Acceptance Criteria:**

**Given** los contratos DESIGN.md y EXPERIENCE.md (ux-labradog-2026-06-12)
**When** se aplica el tema vía variables shadcn en globals.css
**Then** todos los tokens de DESIGN.md quedan mapeados (--primary menta, --secondary mar, radius, etc.) y NINGUNA página usa colores/radios ad-hoc; el contraste cumple AA (tinta #1F3833 sobre menta — jamás blanco sobre menta)

**And** existe el app shell de EXPERIENCE.md: layout del paseador con bottom-nav fija (Mi día 🐾 / Mi capacitación 🎓) y layout del admin con nav horizontal (Equipo · Tutores · Perros · Paseadores) + breadcrumb en páginas de detalle

**And** TODA pantalla no-raíz tiene "← volver" arriba a la izquierda, en la misma posición

**And** las pantallas existentes quedan retrofiteadas (portada, login, forgot/reset, admin home/equipo/tutores/tutores-id/perros-id/paseadores/paseadores-userId, paseador home/mi-capacitacion/mi-capacitacion-slug) SIN cambios de comportamiento: misma data, mismas reglas, mismos flujos

**And** las listas existentes muestran los estados vacío/carga según EXPERIENCE.md

**And** regresión completa verde: lint + unit + build + los 14 E2E (ajustando selectores solo si cambió texto visible)
```

### 4.2 sprint-status.yaml — insertar ANTES de 2-3 (el orden del archivo es el orden de ejecución)

```
  2-8-app-shell-y-rediseno-menta-mar: backlog   # ← se ejecuta antes que 2.3 (rediseño primero)
  2-3-tests-de-etapa-autocorregibles: backlog
```

## 5. Handoff de implementación

- **Clasificación**: Moderada (reorganización del backlog, sin replan).
- **Ruta**: este mismo flujo BMAD — `create-story` para la 2.8 (cargará automáticamente los contratos UX por los overrides nuevos) → `dev-story` → `code-review`.
- **Criterio de éxito**: las maquetas de `mockups/key-screens-1.html` son reconocibles en la app real; ningún E2E de comportamiento roto.

— Propuesta generada por correct-course · aprobación pendiente de Nelson
