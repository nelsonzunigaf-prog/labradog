---
baseline_commit: fe88c91
---

# Story 2.8: App shell y rediseño Menta & Mar

Status: review

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

- [x] Task 1: Tema Menta & Mar en `globals.css` (AC: 1)
  - [x] LEER el `globals.css` actual ANTES de tocar (Tailwind 4 + shadcn: variables en `:root` posiblemente en oklch — respetar el formato existente, los hex de DESIGN.md pueden ir directo o convertidos, lo que el archivo ya use).
  - [x] Mapear el bloque `:root` con los tokens de DESIGN.md#Colors (mapeo shadcn explícito en el contrato): background/foreground/card/primary/primary-foreground/secondary/secondary-foreground/muted/muted-foreground/accent/accent-foreground/destructive/border/input/ring/radius.
  - [x] Tokens extra del producto como variables CSS adicionales (`--primary-deep`, `--primary-soft`, `--secondary-deep`, `--secondary-soft`, `--secondary-ink`, `--success`, `--success-soft`, `--warning`, `--destructive-text`) + utilidades Tailwind si el patrón del archivo lo permite (`@theme inline`).
  - [x] NO tocar `src/components/ui/` (regla de DESIGN.md: extender vía variables, jamás editar shadcn a mano). Dark mode NO (fuera de alcance v1 — dejar el bloque `.dark` como esté).

- [x] Task 2: Shell del paseador — bottom-nav (AC: 2, 3)
  - [x] LEER `src/app/paseador/layout.tsx` actual (tiene el gate de rol — NO romperlo: el shell se agrega alrededor del children, el redirect queda intacto).
  - [x] `src/components/shell/bottom-nav-paseador.tsx` (client component — `usePathname` para el activo): nav fija inferior, 2 ítems ≥48px con icono+etiqueta visible (Mi día 🐾 `PawPrint` `/paseador` · Mi capacitación 🎓 `GraduationCap` `/paseador/mi-capacitacion`), activo en `primary-deep` con indicador. Fondo card, borde superior, `pb-safe` (safe-area iOS).
  - [x] Integrar en el layout del paseador: `children` con `pb-20` (espacio para la nav) + `<BottomNavPaseador />`. Vista centrada `max-w-md` en ≥md (EXPERIENCE#Responsive).
  - [x] `src/app/paseador/page.tsx`: QUITAR el link "Mi capacitación →" (ahora vive en la bottom-nav); vacío de Mi día con el microcopy del contrato ("Aún no tienes paseos para hoy 🐾"); título display con `secondary-ink`.

- [x] Task 3: Shell del admin — header con nav + breadcrumbs (AC: 2, 3)
  - [x] LEER `src/app/admin/layout.tsx` actual (gate de rol intacto).
  - [x] `src/components/shell/nav-admin.tsx` (client, `usePathname`): header sticky con "Labradog 🐾" (link a `/admin`) + nav horizontal (Equipo `/admin/equipo` · Tutores `/admin/tutores` · Perros — SIN ruta de lista propia hoy: omitir hasta que exista, NO inventar página · Paseadores `/admin/paseadores`) + `CerrarSesion` a la derecha. Activo con borde inferior `primary`. En `<md`: colapsa a menú `Sheet` de shadcn SOLO si ya está instalado; si no, nav horizontal con scroll-x (NO instalar componentes nuevos).
  - [x] Breadcrumb component liviano (`src/components/shell/breadcrumb.tsx`, server): `Tutores / María Pérez` bajo el header en páginas de detalle.
  - [x] "← volver" consistente en TODAS las páginas de detalle admin (tutores/[id], perros/[id], paseadores/[userId]) — arriba izquierda, antes del título. Contenedor `max-w-6xl` + gutter 24px.
  - [x] Quitar de las pages los headers/links manuales que el shell reemplaza (sin duplicar navegación). El `CerrarSesion` sale de las pages individuales si pasa al header.

- [x] Task 4: Retrofit de pantallas (AC: 1, 3, 4)
  - [x] Portada y login/forgot/reset: marca "Labradog 🐾" + tagline "Cuidamos a quienes cuidan", card blanca sobre fondo `background`, huellas decorativas sutiles SOLO en login/portada (CSS, opacidad ≤0.07 — referencia `mockups/key-screens-1.html`), botón primario menta con tinta oscura.
  - [x] Admin pages: títulos `title` (20/700), tablas con header `caption-desktop` y hover; badges con el vocabulario de DESIGN.md (certificado=éxito, sin certificar=neutro, activo=info, inactivo=neutro apagado) — revisar Badge variants usadas hoy y ajustar clases, NO editar ui/badge.tsx.
  - [x] Paseador pages: Mi capacitación ya cumple casi todo — ajustar a tokens (barra de progreso `progress` del contrato, card de etapa EN CURSO con borde 2px primary + sombra destacada, bloqueada opacity 0.55), pill "Continuar" → `button-advance` (mar profundo + blanco, rounded-full). Detalle de etapa: tipografía del contrato.
  - [x] Verificación AA en cada cambio: nada de texto blanco sobre `--primary`; texto menta sobre blanco usa `primary-deep`.

- [x] Task 5: Estados de carga y vacío (AC: 5)
  - [x] `loading.tsx` con `Skeleton` (shadcn — verificar que esté instalado; si no, filas con `animate-pulse` y clases, sin instalar nada) para: `/admin/equipo`, `/admin/tutores`, `/admin/paseadores`, `/paseador/mi-capacitacion`.
  - [x] Estados vacíos con microcopy del contrato en las listas que ya manejan el caso (tutores sin filas, paseadores sin cuentas, Mi día).

- [x] Task 6: E2E y regresión (AC: 6)
  - [x] Ajustar specs SOLO donde cambió lo visible: `capacitacion.spec.ts` (el link de Mi día → bottom-nav: `getByRole('link', { name: /Mi capacitación/ })` sigue funcionando si la nav usa ese texto — verificar), posibles headers/títulos movidos en admin specs.
  - [x] `npm run lint && npm run test && npm run build` + suite E2E completa (14) verdes.
  - [x] Comparar visualmente contra `mockups/key-screens-1.html` (login, mi capacitación, admin paseadores) — criterio de éxito del change proposal: las maquetas son reconocibles en la app real.

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

claude-fable-5 (Claude Code) — orquestación con 2 subagentes paralelos para el retrofit (admin y auth/portada), cada uno leyendo los contratos UX y los E2E afectados.

### Debug Log References

- Sin incidencias: lint verde en cada frente, los 14 E2E pasaron a la primera tras el único ajuste de selector previsto (link de capacitación → bottom-nav con `exact: true`).
- `Skeleton` y `Sheet` de shadcn NO están instalados → loading states con `animate-pulse` plano y nav admin con scroll-x en `<md` (alternativas previstas por la story; cero componentes nuevos).

### Completion Notes List

- **Tema Menta & Mar en `globals.css`**: `:root` mapeado completo a los tokens del contrato (hex directos — conviven con los oklch restantes), `--radius` 0.875rem, tokens del producto (`--primary-deep`, `--success-soft`, etc.) expuestos como clases Tailwind vía `@theme inline`. Bloque `.dark` intacto (fuera de alcance v1). `src/components/ui/` sin tocar.
- **Shell paseador**: `BottomNavPaseador` (client, `usePathname`, safe-area iOS, ítems ≥48px, activo en `primary-deep`) montada en el layout (gate de rol intacto) con `max-w-md` centrado y `pb-20`. Mi día pierde el link manual (vive en la nav) y gana el vacío del contrato ("Aún no tienes paseos para hoy 🐾").
- **Shell admin**: `NavAdmin` (header sticky: marca + Equipo·Tutores·Paseadores con activo en borde `primary` + CerrarSesion) montada en el layout (gate intacto) con `max-w-6xl`; "Perros" omitido a propósito (no existe página de lista — no se inventó). `Volver` + `Breadcrumb` en las 3 páginas de detalle; headers duplicados eliminados de las pages.
- **Retrofit**: portada/login/forgot/reset con marca, tagline "Cuidamos a quienes cuidan", huellas sutiles (opacity 0.07, aria-hidden) y botón menta con tinta AA; admin con tablas en cards, thead caption-desktop y badges al vocabulario (activo=info, sin certificar=neutro, alerta=warning con tinta); paseador con card de etapa EN CURSO (borde 2px primary + sombra destacada), bloqueada 0.55, pill "Continuar" en `secondary-deep` (button-advance, AA), errores `text-destructive-text` y éxitos `text-success` en todos los forms.
- **Estados de carga**: 4 `loading.tsx` (`equipo`, `tutores`, `paseadores`, `mi-capacitacion`) calcando el layout con `animate-pulse`.
- **Comportamiento**: CERO cambios — ni motores, ni queries, ni actions, ni schema, ni textos funcionales (único selector E2E ajustado: el previsto). Verificación: lint ✅ · **133/133 unit** ✅ · build ✅ · **14/14 E2E** ✅.

#### Acción requerida de Nelson

- Revisar visualmente en `localhost:3000` (el dev server recarga solo): portada → login → admin (header nuevo, breadcrumbs, badges) → paseador (bottom-nav, Mi capacitación). Comparar contra `mockups/key-screens-1.html`.

### File List

- labradog-app/src/app/globals.css (modificado — tema Menta & Mar + tokens del producto)
- labradog-app/src/components/shell/bottom-nav-paseador.tsx · nav-admin.tsx · volver.tsx (nuevos — app shell)
- labradog-app/src/app/paseador/layout.tsx · admin/layout.tsx (modificados — shells, gates intactos)
- labradog-app/src/app/page.tsx · (auth)/login/page.tsx · (auth)/forgot-password/page.tsx · (auth)/reset-password/page.tsx (modificados — retrofit)
- labradog-app/src/app/paseador/page.tsx · mi-capacitacion/page.tsx (modificados — retrofit + bottom-nav)
- labradog-app/src/app/admin/page.tsx · equipo/page.tsx · tutores/page.tsx · tutores/[id]/page.tsx · perros/[id]/page.tsx · paseadores/page.tsx · paseadores/[userId]/page.tsx (modificados — shell/breadcrumbs/badges/tablas)
- labradog-app/src/components/{equipo,tutores,perros,paseadores}/*.tsx (modificados — solo clases visuales: cards, success/destructive-text, warning)
- labradog-app/src/app/admin/{equipo,tutores,paseadores}/loading.tsx · paseador/mi-capacitacion/loading.tsx (nuevos — skeletons)
- labradog-app/e2e/capacitacion.spec.ts (modificado — selector bottom-nav)

## Change Log

- 2026-06-12: Story 2.8 creada vía correct-course + create-story con los contratos UX como persistent_facts. Status → ready-for-dev.
- 2026-06-12: Implementación completa (orquestada con 2 subagentes de retrofit en paralelo): tema en globals.css, shells paseador/admin, retrofit de 14 pantallas + 10 componentes, 4 loading states. Cero cambios de comportamiento. lint+133 unit+build+14 E2E verdes. Status → review.
- 2026-06-12 (PM): **Pivote de paleta** — Nelson aportó `docs/estilo-demo.html` (sistema visual de la landing real). El tema "Menta & Mar" se reemplazó por el sistema **EMERALD + neutros** de la landing: primario emerald-700 #047857 (pill, blanco AA 4.54:1), neutros, títulos semibold tracking -0.025em, cuerpo neutral-700. Los aliases de token (--secondary-deep, --secondary-ink…) conservan su NOMBRE y re-apuntan al sistema emerald → cero cambios en el código de las pantallas (solo `globals.css` + 5 toques de firma: pills, semibold, marca emerald). DESIGN.md, guardarraíles (_bmad/custom, project-context) y decision-log actualizados. Regresión: lint+133 unit+build+E2E (13 passed + 1 flaky por cold-start de Neon, recuperado en retry) verdes.
