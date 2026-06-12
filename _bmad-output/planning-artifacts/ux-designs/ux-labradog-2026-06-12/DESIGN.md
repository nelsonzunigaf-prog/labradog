---
name: Labradog
status: final
updated: 2026-06-12
description: Identidad visual "Menta & Mar" para la plataforma interna de Labradog (cuidado profesional de mascotas, Chile). shadcn/ui sobre Next.js 16 + Tailwind 4; este DESIGN.md especifica solo el delta de marca sobre los defaults de shadcn.
colors:
  # Paleta Menta & Mar — hex exactos de .working/color-themes-1.html, variación 3.
  # Todo token shadcn no listado hereda del default (popover, popover-foreground, etc.).
  primary: '#5FBFA8'              # menta — color de marca
  primary-foreground: '#1F3833'   # tinta oscura sobre menta (blanco sobre menta NO pasa AA: 2.2:1)
  primary-deep: '#2E7D6B'         # menta oscuro derivado — usos TEXTUALES del primario sobre blanco (4.9:1)
  primary-soft: '#DCF3EC'         # menta suave — fondos de chips, barras de progreso, avatares
  secondary: '#4E7E9B'            # mar (azul petróleo) — acciones de avance, pills, énfasis dual
  secondary-foreground: '#FFFFFF' # blanco sobre mar = 4.4:1 — solo texto ≥14px bold; texto normal usa secondary-deep
  secondary-deep: '#3E6981'       # mar profundo derivado — texto blanco normal AA (5.9:1) y texto mar sobre blanco
  secondary-soft: '#E1ECF3'       # azul suave — fondo de badges informativos (del HTML v3)
  secondary-ink: '#2A4456'        # tinta azulada para títulos de app móvil (del HTML v3)
  background: '#F2FAF7'           # fondo de página menta muy claro
  foreground: '#1F3833'           # texto principal
  card: '#FFFFFF'
  card-foreground: '#1F3833'
  muted: '#DCF3EC'
  muted-foreground: '#5E7A74'     # texto secundario
  accent: '#E1ECF3'
  accent-foreground: '#2A4456'
  border: '#D6EAE2'
  input: '#D6EAE2'
  ring: '#5FBFA8'
  destructive: '#D16A5E'          # peligro suave — fondos/botones destructivos
  destructive-foreground: '#FFFFFF'
  destructive-text: '#A8483C'     # rojo derivado para TEXTO de error sobre blanco (5.4:1 AA)
  success: '#34A084'              # éxito — certificado, aprobado, completado
  success-soft: '#DFF2ED'         # fondo de badges de éxito (derivado ~16% sobre blanco)
  warning: '#E0B14E'              # alerta suave — siempre con tinta oscura encima
  warning-foreground: '#1F3833'
typography:
  # Geist Sans ya instalada vía next/font en el scaffold. Jerarquía móvil-primero.
  display:
    fontFamily: 'Geist'
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  title:
    fontFamily: 'Geist'
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.25'
  subtitle:
    fontFamily: 'Geist'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.35'
  body:
    fontFamily: 'Geist'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: 'Geist'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
  label:
    fontFamily: 'Geist'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.3'
  caption-desktop:
    fontFamily: 'Geist'
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.04em
rounded:
  # Esquinas generosas — suavidad de marca. --radius de shadcn = lg.
  sm: 8px
  md: 12px
  lg: 14px
  xl: 16px
  full: 9999px
  DEFAULT: 14px
spacing:
  # Escala Tailwind 4 heredada (base 4px). Tokens nombrados del producto:
  touch-target: 48px
  gutter-mobile: 16px
  gutter-desktop: 24px
  card-padding: 16px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    min-height: '{spacing.touch-target}'
  button-advance:
    # Acción de AVANCE (Continuar, Comenzar test) — el dual mar del tema
    background: '{colors.secondary-deep}'
    foreground: '#FFFFFF'
    radius: '{rounded.full}'
    min-height: '{spacing.touch-target}'
  button-destructive:
    background: '{colors.destructive}'
    foreground: '{colors.destructive-foreground}'
    radius: '{rounded.md}'
  card:
    background: '{colors.card}'
    border: '1px solid {colors.border}'
    radius: '{rounded.xl}'
    shadow: '0 1px 4px rgba(25, 40, 32, 0.06)'
  badge-certificado:
    background: '{colors.success-soft}'
    foreground: '{colors.success}'
    radius: '{rounded.full}'
  badge-info:
    background: '{colors.secondary-soft}'
    foreground: '{colors.secondary-deep}'
    radius: '{rounded.full}'
  badge-neutro:
    background: '{colors.muted}'
    foreground: '{colors.muted-foreground}'
    radius: '{rounded.full}'
  badge-alerta:
    background: '{colors.warning}'
    foreground: '{colors.warning-foreground}'
    radius: '{rounded.full}'
  progress:
    track: '{colors.primary-soft}'
    fill: '{colors.primary}'
    radius: '{rounded.full}'
  input:
    background: '{colors.card}'
    border: '1px solid {colors.input}'
    radius: '{rounded.md}'
    min-height: '{spacing.touch-target}'
  table-row-hover:
    background: '{colors.background}'
---

## Brand & Style

Labradog es cuidado profesional de mascotas: una marca chilena joven, moderna y suave que tutea (es-CL) con cercanía profesional. La expresión visual es el tema **Menta & Mar**: dual verde menta (primario, el cuidado fresco) + azul petróleo (secundario, la confianza que avanza), sobre fondos menta muy claros que dejan respirar el contenido. La huella 🐾 es el motivo de marca — aparece como acento puntual (header de la app del paseador, portada), nunca como tapiz.

El sistema hereda shadcn/ui completo. Este DESIGN.md especifica **solo el delta de marca** vía variables CSS en `globals.css` — no se rediseñan componentes uno a uno. **Dark mode: fuera de alcance v1** (los tokens definidos son modo claro; si llega dark, será un archivo de tokens aparte).

## Colors

- **Menta `{colors.primary}` (#5FBFA8)** — color de marca. Botones primarios, barras de progreso, anillos de foco, estados activos. **Regla dura de contraste:** blanco sobre menta da 2.2:1 (falla AA); todo texto sobre menta usa la tinta `{colors.primary-foreground}` (#1F3833, 4.6:1). Cuando el primario actúa como TEXTO sobre blanco (links, montos, porcentajes), se usa `{colors.primary-deep}` (#2E7D6B, 4.9:1) — nunca el menta puro como texto.
- **Mar `{colors.secondary}` (#4E7E9B)** — el segundo registro del dual. Acciones de avance (pill "Continuar"), navegación activa del admin, énfasis informativo. Blanco sobre mar puro da 4.4:1: suficiente solo para texto bold ≥14px; los botones sólidos con texto normal usan `{colors.secondary-deep}` (#3E6981, 5.9:1).
- **Fondos**: página `{colors.background}` (#F2FAF7, menta casi blanco), cards `{colors.card}` (blanco puro). El contraste página/card crea la jerarquía sin sombras pesadas.
- **Semánticos suaves**: éxito #34A084 (certificado/aprobado), alerta #E0B14E (siempre con tinta oscura encima — blanco sobre ámbar falla AA), peligro #D16A5E (botones destructivos con blanco bold; el TEXTO de error sobre blanco usa `{colors.destructive-text}` #A8483C).
- **Texto**: principal #1F3833 (verde-tinta, 13.3:1 sobre blanco), secundario #5E7A74 (4.7:1 — apto para metadatos).

Mapeo shadcn (`:root` en `globals.css`): `--background: #F2FAF7` · `--foreground: #1F3833` · `--card: #FFFFFF` · `--card-foreground: #1F3833` · `--primary: #5FBFA8` · `--primary-foreground: #1F3833` · `--secondary: #4E7E9B` · `--secondary-foreground: #FFFFFF` · `--muted: #DCF3EC` · `--muted-foreground: #5E7A74` · `--accent: #E1ECF3` · `--accent-foreground: #2A4456` · `--destructive: #D16A5E` · `--border: #D6EAE2` · `--input: #D6EAE2` · `--ring: #5FBFA8` · `--radius: 0.875rem`. [ASSUMPTION] Se entregan en hex; Tailwind 4 los acepta directo — convertir a oklch es opcional y no cambia el contrato.

## Typography

Geist Sans (ya instalada vía `next/font`) en toda la superficie — sin segunda familia. Jerarquía móvil-primero:

- `{typography.display}` (24/800) — título de pantalla del paseador ("Mi capacitación 🐾"). En móvil usa la tinta `{colors.secondary-ink}` para el registro dual.
- `{typography.title}` (20/700) — títulos de sección y de ficha en admin.
- `{typography.subtitle}` (16/600) — nombres en filas y cards.
- `{typography.body}` (16) / `{typography.body-sm}` (14) — contenido y metadatos.
- `{typography.caption-desktop}` (12, uppercase, tracking) — SOLO admin desktop (rótulos de tabla). **En móvil ningún texto baja de 14px.**

## Layout & Spacing

Escala Tailwind heredada (4, 8, 12, 16, 24, 32, 48…). Móvil paseador: una columna, gutter `{spacing.gutter-mobile}` (16px), filas táctiles ≥ `{spacing.touch-target}` (48px) y separación mínima 8px entre zonas tocables. Admin desktop: contenedor `max-w-6xl`, gutter 24px, tablas anchas permitidas. El fondo de página siempre es `{colors.background}`; el contenido vive en cards blancas.

## Elevation & Depth

Sombras suaves y de un solo nivel: cards `0 1px 4px rgba(25,40,32,0.06)`; el elemento DESTACADO (etapa en curso, card activa) sube a `0 4px 14px rgba(25,40,32,0.10)` + borde 2px `{colors.primary}`. Nada de sombras duras ni capas apiladas — la jerarquía la dan el fondo menta vs. card blanca y el borde, no la elevación.

## Shapes

Esquinas generosas = suavidad de marca: inputs y botones `{rounded.md}` (12px), cards `{rounded.xl}` (16px), badges y pills `{rounded.full}`. `--radius: 0.875rem` (14px) como base shadcn. Avatares e iconos de estado: círculos perfectos sobre `{colors.primary-soft}`.

## Components

Todos extienden shadcn — nunca se reescriben desde cero. `src/components/ui/` no se edita a mano.

- **Button** — `default` = `{components.button-primary}` (menta + tinta oscura, ≥48px en móvil). Variante de avance (pill "Continuar", "Comenzar test") = `{components.button-advance}` (mar profundo + blanco, `{rounded.full}`). `destructive` = `{components.button-destructive}`. `outline`/`ghost` heredan shadcn con borde `{colors.border}`.
- **Card** — `{components.card}`. Card de etapa EN CURSO: borde 2px `{colors.primary}` + sombra destacada. Etapa BLOQUEADA: `opacity: 0.55`, sin sombra.
- **Badge** — vocabulario semántico fijo: certificado/aprobado = `{components.badge-certificado}`; informativo (rol, plan) = `{components.badge-info}`; sin certificar/neutro = `{components.badge-neutro}`; alerta = `{components.badge-alerta}`; inactivo = neutro con texto `{colors.muted-foreground}`.
- **Table** (admin) — header en `{typography.caption-desktop}` color `{colors.muted-foreground}`, filas con borde `{colors.border}`, hover `{components.table-row-hover}`. En móvil la tabla NO se encoge: se colapsa a cards.
- **Input** — `{components.input}`, foco con anillo `{colors.ring}` de 2px. Altura ≥48px en móvil.
- **Progress** — `{components.progress}`: pista menta suave, relleno menta, siempre acompañada del dato textual ("3 de 10 etapas · 30%").

## Do's and Don'ts

| Do | Don't |
|---|---|
| Huella 🐾 e iconos Lucide de mascotas (`PawPrint`, `Dog`, `Bone`) como acentos puntuales | Fotos de stock pesadas o bancos de imágenes genéricos |
| Tinta oscura `{colors.primary-foreground}` sobre menta; `{colors.primary-deep}` para texto menta sobre blanco | Texto blanco sobre menta puro (2.2:1 — falla AA siempre) |
| Fondos planos menta claro + cards blancas | Gradientes chillones o degradados decorativos |
| Texto ≥14px en móvil, zonas táctiles ≥48px | Texto bajo 14px o controles bajo 48px en la app del paseador |
| Extender shadcn vía variables CSS en `globals.css` | Editar `src/components/ui/` a mano o reinventar componentes |
| Badges con el vocabulario semántico fijo (certificado=éxito, neutro, bloqueada=atenuada) | Inventar colores ad-hoc por pantalla para estados ya nombrados |
| Sombras suaves de un nivel; jerarquía por fondo y borde | Sombras duras, glassmorphism, elevación como decoración |
