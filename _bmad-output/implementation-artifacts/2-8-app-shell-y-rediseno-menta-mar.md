---
baseline_commit: fe88c91
---

# Story 2.8: App shell y rediseño Menta & Mar

Status: ready-for-dev

> ⚠️ Se ejecuta ANTES que la 2.3 (sprint-change-proposal-2026-06-12). Numerada 2.8 para no renumerar referencias.

## Story

As a usuario de Labradog (admin o paseador),
I want que toda la plataforma tenga la identidad Menta & Mar y navegación consistente,
so that la herramienta refleja el cuidado de la marca y nunca quedo atrapado en una pantalla.

## Acceptance Criteria

1. **Given** los contratos `DESIGN.md` y `EXPERIENCE.md` (`ux-designs/ux-labradog-2026-06-12/`), **When** se aplica el tema vía variables shadcn en `globals.css`, **Then** todos los tokens de DESIGN.md quedan mapeados (`--primary` #5FBFA8, `--primary-foreground` #1F3833, `--secondary` #4E7E9B, `--background` #F2FAF7, `--radius` 0.875rem, etc.) y NINGUNA página usa colores/radios ad-hoc; contraste AA (tinta sobre menta — **jamás blanco sobre menta**, 2.2:1 falla).
2. **And** existe el app shell de EXPERIENCE.md: layout del paseador con **bottom-nav fija** (Mi día 🐾 / Mi capacitación 🎓, activo en `primary-deep`, ítems ≥48px) y layout del admin con **header de navegación horizontal** (Equipo · Tutores · Perros · Paseadores — sección activa marcada) + **breadcrumb** en páginas de detalle.
3. **And** TODA pantalla no-raíz tiene "← volver" arriba a la izquierda, misma posición, primer elemento enfocable, zona táctil ≥48px.
4. **And** las pantallas existentes quedan retrofiteadas SIN cambios de comportamiento (misma data, mismas reglas, mismos flujos): portada, login, forgot/reset-password, admin (home, equipo, tutores, tutores/[id], perros/[id], paseadores, paseadores/[userId]), paseador (home, mi-capacitacion, mi-capacitacion/[slug]).
5. **And** las listas existentes tienen estados de carga (`loading.tsx` con Skeleton calcando el layout) y vacío con el microcopy de EXPERIENCE.md ("Todavía no hay {entidad}." / "Aún no tienes paseos para hoy 🐾").
6. **And** regresión completa verde: lint + unit + build + los **14 E2E** (ajustando selectores SOLO donde cambió texto/estructura visible — p.ej. el link "Mi capacitación →" de Mi día pasa a la bottom-nav).

## Tasks / Subtasks

- [ ] Task 1: Tema Menta & Mar en `globals.css` (AC: 1)
  - [ ] LEER el `globals.css` actual ANTES de tocar (Tailwind 4 + shadcn: variables en `:root` posiblemente en oklch — respetar el formato existente, los hex de DESIGN.md pueden ir directo o convertidos, lo que el archivo ya use).
  - [ ] Mapear el bloque `:root` con los tokens de DESIGN.md#Colors (mapeo shadcn explícito en el contrato): background/foreground/card/primary/primary-foreground/secondary/secondary-foreground/muted/muted-foreground/accent/accent-foreground/destructive/border/input/ring/radius.
  - [ ] Tokens extra del producto como variables CSS adicionales (`--primary-deep`, `--primary-soft`, `--secondary-deep`, `--secondary-soft`, `--secondary-ink`, `--success`, `--success-soft`, `--warning`, `--destructive-text`) + utilidades Tailwind si el patrón del archivo lo permite (`@theme inline`).
  - [ ] NO tocar `src/components/ui/` (regla de DESIGN.md: extender vía variables, jamás editar shadcn a mano). Dark mode NO (fuera de alcance v1 — dejar el bloque `.dark` como esté).

- [ ] Task 2: Shell del paseador — bottom-nav (AC: 2, 3)
  - [ ] LEER `src/app/paseador/layout.tsx` actual (tiene el gate de rol — NO romperlo: el shell se agrega alrededor del children, el redirect queda intacto).
  - [ ] `src/components/shell/bottom-nav-paseador.tsx` (client component — `usePathname` para el activo): nav fija inferior, 2 ítems ≥48px con icono+etiqueta visible (Mi día 🐾 `PawPrint` `/paseador` · Mi capacitación 🎓 `GraduationCap` `/paseador/mi-capacitacion`), activo en `primary-deep` con indicador. Fondo card, borde superior, `pb-safe` (safe-area iOS).
  - [ ] Integrar en el layout del paseador: `children` con `pb-20` (espacio para la nav) + `<BottomNavPaseador />`. Vista centrada `max-w-md` en ≥md (EXPERIENCE#Responsive).
  - [ ] `src/app/paseador/page.tsx`: QUITAR el link "Mi capacitación →" (ahora vive en la bottom-nav); vacío de Mi día con el microcopy del contrato ("Aún no tienes paseos para hoy 🐾"); título display con `secondary-ink`.

- [ ] Task 3: Shell del admin — header con nav + breadcrumbs (AC: 2, 3)
  - [ ] LEER `src/app/admin/layout.tsx` actual (gate de rol intacto).
  - [ ] `src/components/shell/nav-admin.tsx` (client, `usePathname`): header sticky con "Labradog 🐾" (link a `/admin`) + nav horizontal (Equipo `/admin/equipo` · Tutores `/admin/tutores` · Perros — SIN ruta de lista propia hoy: omitir hasta que exista, NO inventar página · Paseadores `/admin/paseadores`) + `CerrarSesion` a la derecha. Activo con borde inferior `primary`. En `<md`: colapsa a menú `Sheet` de shadcn SOLO si ya está instalado; si no, nav horizontal con scroll-x (NO instalar componentes nuevos).
  - [ ] Breadcrumb component liviano (`src/components/shell/breadcrumb.tsx`, server): `Tutores / María Pérez` bajo el header en páginas de detalle.
  - [ ] "← volver" consistente en TODAS las páginas de detalle admin (tutores/[id], perros/[id], paseadores/[userId]) — arriba izquierda, antes del título. Contenedor `max-w-6xl` + gutter 24px.
  - [ ] Quitar de las pages los headers/links manuales que el shell reemplaza (sin duplicar navegación). El `CerrarSesion` sale de las pages individuales si pasa al header.

- [ ] Task 4: Retrofit de pantallas (AC: 1, 3, 4)
  - [ ] Portada y login/forgot/reset: marca "Labradog 🐾" + tagline "Cuidamos a quienes cuidan", card blanca sobre fondo `background`, huellas decorativas sutiles SOLO en login/portada (CSS, opacidad ≤0.07 — referencia `mockups/key-screens-1.html`), botón primario menta con tinta oscura.
  - [ ] Admin pages: títulos `title` (20/700), tablas con header `caption-desktop` y hover; badges con el vocabulario de DESIGN.md (certificado=éxito, sin certificar=neutro, activo=info, inactivo=neutro apagado) — revisar Badge variants usadas hoy y ajustar clases, NO editar ui/badge.tsx.
  - [ ] Paseador pages: Mi capacitación ya cumple casi todo — ajustar a tokens (barra de progreso `progress` del contrato, card de etapa EN CURSO con borde 2px primary + sombra destacada, bloqueada opacity 0.55), pill "Continuar" → `button-advance` (mar profundo + blanco, rounded-full). Detalle de etapa: tipografía del contrato.
  - [ ] Verificación AA en cada cambio: nada de texto blanco sobre `--primary`; texto menta sobre blanco usa `primary-deep`.

- [ ] Task 5: Estados de carga y vacío (AC: 5)
  - [ ] `loading.tsx` con `Skeleton` (shadcn — verificar que esté instalado; si no, filas con `animate-pulse` y clases, sin instalar nada) para: `/admin/equipo`, `/admin/tutores`, `/admin/paseadores`, `/paseador/mi-capacitacion`.
  - [ ] Estados vacíos con microcopy del contrato en las listas que ya manejan el caso (tutores sin filas, paseadores sin cuentas, Mi día).

- [ ] Task 6: E2E y regresión (AC: 6)
  - [ ] Ajustar specs SOLO donde cambió lo visible: `capacitacion.spec.ts` (el link de Mi día → bottom-nav: `getByRole('link', { name: /Mi capacitación/ })` sigue funcionando si la nav usa ese texto — verificar), posibles headers/títulos movidos en admin specs.
  - [ ] `npm run lint && npm run test && npm run build` + suite E2E completa (14) verdes.
  - [ ] Comparar visualmente contra `mockups/key-screens-1.html` (login, mi capacitación, admin paseadores) — criterio de éxito del change proposal: las maquetas son reconocibles en la app real.

## Dev Notes

### Contexto y alcance

Story de retrofit presentacional: aplica los contratos de UX a TODO lo construido sin tocar comportamiento, schema ni reglas. Los contratos (`DESIGN.md`, `EXPERIENCE.md`) ya están cargados como persistent_facts por los overrides de `_bmad/custom/` — son LA especificación; esta story solo orquesta su aplicación. Ante cualquier duda visual, el contrato manda sobre el gusto del dev. [Source: sprint-change-proposal-2026-06-12.md; ux-designs/ux-labradog-2026-06-12/]

### Decisiones de diseño clave

- **Cero cambios de comportamiento**: mismos flujos, misma data, mismas validaciones. Si un retoque visual obliga a cambiar lógica, ESO está fuera de alcance — anotarlo y seguir.
- **El tema entra por variables CSS** (`globals.css`), no por clases pintadas página a página. Las páginas solo cambian estructura (shell, volver, breadcrumb) y clases semánticas de Tailwind que ya leen las variables (`bg-primary`, `text-muted-foreground`...). Colores literales (`text-green-600` del check de etapa, `bg-zinc-50` de la portada) se reemplazan por tokens.
- **Leer ANTES de tocar**: `globals.css` (formato de variables actual), `paseador/layout.tsx` y `admin/layout.tsx` (gates de rol que NO pueden romperse), cada page del retrofit.
- **Sin dependencias nuevas ni componentes shadcn nuevos** — si `Skeleton`/`Sheet` no están instalados, resolver con Tailwind plano. `lucide-react` ya está (PawPrint, GraduationCap, Dog).
- **E2E**: los 14 specs son la red de seguridad del "sin cambios de comportamiento". Cambios de selectores esperados: link de capacitación en Mi día (→ bottom-nav). Los `data-testid` de 2.2 (avance, etapa-N, mensaje-bloqueada, contenido-etapa) NO se tocan.
- **"Perros" no va en la nav admin**: hoy no existe página de lista de perros (viven dentro de la ficha del tutor); no inventarla.

### Archivos que se MODIFICAN (leer su estado actual antes de tocar)

- `src/app/globals.css` — variables del tema.
- `src/app/paseador/layout.tsx` y `src/app/admin/layout.tsx` — shells (gates intactos).
- Pages: `page.tsx` (portada), `(auth)/login` + forgot/reset, `admin/page.tsx`, `admin/equipo/page.tsx`, `admin/tutores/page.tsx` + `[id]`, `admin/perros/[id]`, `admin/paseadores/page.tsx` + `[userId]`, `paseador/page.tsx`, `paseador/mi-capacitacion/page.tsx` + `[slug]`.
- E2E specs afectados por texto/estructura.

### Qué NO hacer

- NO editar `src/components/ui/` (shadcn) a mano.
- NO dark mode, NO `@tailwindcss/typography`, NO dependencias ni componentes nuevos.
- NO páginas nuevas (lista de perros, tablero capacitación — son de otras stories).
- NO tocar motores, queries, actions, schema ni migraciones.
- NO cambiar microcopy funcional que los E2E asertan, salvo los ajustes listados (y entonces ajustar el spec en el mismo commit).

### Testing standards

- La red es la regresión completa (lint+unit+build+14 E2E). Sin tests unitarios nuevos (no hay lógica nueva); el shell se verifica por E2E existentes + revisión visual contra mockups.

### References

- [Source: ux-designs/ux-labradog-2026-06-12/DESIGN.md] — tokens, componentes, Do's/Don'ts (contrato visual)
- [Source: ux-designs/ux-labradog-2026-06-12/EXPERIENCE.md] — app shell, IA, estados, microcopy, accesibilidad (contrato de experiencia)
- [Source: ux-designs/ux-labradog-2026-06-12/mockups/key-screens-1.html] — referencia visual 1:1
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-06-12.md] — alcance y criterio de éxito

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-06-12: Story 2.8 creada vía correct-course + create-story con los contratos UX como persistent_facts. Status → ready-for-dev.
