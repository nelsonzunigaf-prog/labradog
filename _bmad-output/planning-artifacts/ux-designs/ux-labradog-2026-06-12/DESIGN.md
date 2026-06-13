---
name: Labradog
status: final
updated: 2026-06-12
description: Identidad visual de Labradog para la plataforma interna — alineada al sistema de la landing real (docs/estilo-demo.html, decisión de Nelson 2026-06-12): emerald + neutros, pill buttons, cards generosas. shadcn/ui sobre Next.js 16 + Tailwind 4; este DESIGN.md especifica solo el delta de marca sobre los defaults de shadcn.
colors:
  # Sistema EMERALD + NEUTROS — fuente: docs/estilo-demo.html (landing de Labradog).
  # Todo token shadcn no listado hereda del default.
  primary: '#047857'              # emerald-700 — marca y botón primario (blanco 4.54:1 AA ✓; el demo usa emerald-600 de base pero falla AA con texto normal — ajuste documentado)
  primary-foreground: '#FFFFFF'
  primary-hover: '#059669'        # emerald-600 — hover del botón primario
  primary-deep: '#065F46'         # emerald-800 — texto emerald sobre fondos claros con AA holgado
  primary-soft: '#D1FAE5'         # emerald-100 — ring de cards destacadas, chips, fondos suaves
  primary-on-dark: '#A7F3D0'      # emerald-200 — eyebrows/acentos sobre fondos oscuros
  background: '#FAFAFA'           # neutral-50 — fondo de página
  foreground: '#171717'           # neutral-900 — texto principal (titulares; el cuerpo usa neutral-700)
  body-text: '#404040'            # neutral-700 — cuerpo de texto ("nunca negro puro en cuerpo")
  card: '#FFFFFF'
  card-foreground: '#171717'
  muted: '#F5F5F5'                # neutral-100 — fondos sutiles
  muted-foreground: '#525252'     # neutral-600 — texto secundario
  accent: '#D1FAE5'               # emerald-100
  accent-foreground: '#064E3B'    # emerald-900
  border: '#E5E5E5'               # neutral-200
  input: '#D4D4D4'                # neutral-300 — borde de inputs (demo)
  ring: '#10B981'                 # emerald-500 — focus (borde + halo 3px al 25%)
  secondary: '#F5F5F5'            # botones/badges secundarios neutros (convención shadcn)
  secondary-foreground: '#171717'
  secondary-deep: '#047857'       # alias re-apuntado (acciones de avance = emerald; era el mar azul)
  secondary-soft: '#D1FAE5'       # alias re-apuntado (badges informativos en emerald suave)
  secondary-ink: '#171717'        # alias re-apuntado (títulos = neutral-900)
  footer: '#171717'               # neutral-900 — footer/bloques oscuros; marca en emerald-400 #34D399
  destructive: '#DC2626'          # red-600 — acciones destructivas (blanco 4.5:1)
  destructive-text: '#B91C1C'     # red-700 — texto de error sobre blanco
  success: '#047857'              # certificado/aprobado = el emerald de marca
  success-soft: '#D1FAE5'
  warning: '#E0B14E'              # alerta suave — siempre con tinta oscura encima
  warning-foreground: '#171717'
typography:
  # Geist (ya instalada vía next/font). Del demo: títulos SEMIBOLD (600) con
  # tracking -0.025em; eyebrows 12px uppercase tracking 0.3em.
  display:
    fontFamily: 'Geist'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.15'
    letterSpacing: -0.025em
  title:
    fontFamily: 'Geist'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.025em
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
    fontWeight: '500'
    lineHeight: '1.3'
  eyebrow:
    fontFamily: 'Geist'
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.3em
rounded:
  # Del demo: cards muy generosas (rounded-3xl 1.5rem), inputs moderados
  # (0.5rem), botones y badges PILL.
  sm: 6px
  md: 10px
  input: 8px
  card: 24px
  pill: 9999px
  DEFAULT: 12px
spacing:
  touch-target: 48px
  input-height: 44px
  gutter-mobile: 16px
  gutter-desktop: 24px
  card-padding: 24px
  section-y: 80px
components:
  button-primary:
    # PILL — firma de la landing
    background: '{colors.primary}'
    foreground: '#FFFFFF'
    hover: '{colors.primary-hover}'
    radius: '{rounded.pill}'
    min-height: '{spacing.touch-target}'
    shadow: '0 10px 15px -3px rgba(6, 78, 59, 0.4)'
  button-advance:
    # "Continuar", "Comenzar test" — mismo pill primario (sistema de UN acento)
    background: '{colors.primary}'
    foreground: '#FFFFFF'
    radius: '{rounded.pill}'
  button-destructive:
    background: '{colors.destructive}'
    foreground: '#FFFFFF'
    radius: '{rounded.pill}'
  card:
    background: '{colors.card}'
    border: '1px solid {colors.border}'
    radius: '{rounded.card}'
    shadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  card-destacada:
    # plan recomendado, etapa EN CURSO
    border: '1px solid {colors.primary-soft}'
    ring: '0 0 0 2px {colors.primary-soft}'
  badge-certificado:
    background: '{colors.success-soft}'
    foreground: '{colors.primary-deep}'
    radius: '{rounded.pill}'
  badge-info:
    background: '{colors.secondary-soft}'
    foreground: '{colors.primary-deep}'
    radius: '{rounded.pill}'
  badge-neutro:
    background: '{colors.muted}'
    foreground: '{colors.muted-foreground}'
    radius: '{rounded.pill}'
  badge-alerta:
    background: '{colors.warning}'
    foreground: '{colors.warning-foreground}'
    radius: '{rounded.pill}'
  progress:
    track: '{colors.primary-soft}'
    fill: '{colors.primary}'
    radius: '{rounded.pill}'
  input:
    background: '{colors.card}'
    border: '1px solid {colors.input}'
    radius: '{rounded.input}'
    min-height: '{spacing.input-height}'
    focus: 'border {colors.ring} + halo 0 0 0 3px rgba(16,185,129,0.25)'
  eyebrow:
    color: '{colors.primary}'
    on-dark: '{colors.primary-on-dark}'
---

## Brand & Style

Labradog es cuidado profesional de mascotas: marca chilena que tutea (es-CL) con cercanía profesional. **La identidad de la plataforma ES la de la landing real** (fuente: `docs/estilo-demo.html`, decisión de Nelson 2026-06-12): **emerald como única familia de acento, neutros para todo lo demás**, botones pill, cards de esquinas muy generosas, eyebrows uppercase y tipografía Geist semibold con tracking apretado. La huella 🐾 sigue siendo el motivo puntual (header de la app del paseador, portada), nunca tapiz.

El sistema hereda shadcn/ui completo: este DESIGN.md es **solo el delta de marca** vía variables CSS en `globals.css`. Dark mode: fuera de alcance v1. Patrones de marketing del demo (hero oscuro con gradiente, quote-band emerald, footer neutral-900 con marca emerald-400) quedan especificados para portada y futuras superficies públicas.

## Colors

- **Emerald `{colors.primary}` (#047857, emerald-700)** — marca y acción primaria. Es el "color principal de marca / themeColor" del demo. Blanco encima: 4.54:1 AA ✓. Hover: `{colors.primary-hover}` (emerald-600). **Nota AA documentada:** el demo pinta botones con emerald-600 de base (blanco 3.3:1 — falla AA texto normal); la plataforma usa emerald-700 de base y emerald-600 al hover — misma familia, mismo registro, AA garantizado.
- **Texto emerald sobre claro**: `{colors.primary-deep}` (emerald-800). **Sobre fondos oscuros**: `{colors.primary-on-dark}` (emerald-200, patrón eyebrow--light del demo).
- **Neutros** — fondo de página `{colors.background}` (neutral-50), cards blancas, bordes `{colors.border}` (neutral-200), titulares `{colors.foreground}` (neutral-900), **cuerpo de texto `{colors.body-text}` (neutral-700) — "nunca negro puro en cuerpo"** (regla del demo), secundario `{colors.muted-foreground}` (neutral-600).
- **Semánticos**: éxito = el propio emerald (certificado/aprobado); alerta #E0B14E con tinta oscura; destructivo red-600 con blanco / red-700 como texto de error.
- **Focus**: borde `{colors.ring}` (emerald-500) + halo 3px al 25% (`rgba(16,185,129,0.25)`) — patrón exacto del demo.

Mapeo shadcn (`:root`): `--background:#FAFAFA · --foreground:#171717 · --card:#FFF · --primary:#047857 · --primary-foreground:#FFF · --secondary:#F5F5F5 · --secondary-foreground:#171717 · --muted:#F5F5F5 · --muted-foreground:#525252 · --accent:#D1FAE5 · --accent-foreground:#064E3B · --destructive:#DC2626 · --border:#E5E5E5 · --input:#D4D4D4 · --ring:#10B981 · --radius:0.75rem`. Aliases del producto re-apuntados (compatibilidad con el código ya escrito): `--primary-deep:#065F46 · --primary-soft:#D1FAE5 · --secondary-deep:#047857 · --secondary-soft:#D1FAE5 · --secondary-ink:#171717 · --success:#047857 · --success-soft:#D1FAE5 · --warning:#E0B14E · --destructive-text:#B91C1C`.

## Typography

Geist en toda la superficie. Reglas del demo: **títulos semibold (600) con `letter-spacing: -0.025em`** (nunca bold/extrabold), cuerpo en neutral-700. El patrón **eyebrow** (`{typography.eyebrow}`: 12px, uppercase, tracking 0.3em, color emerald) rotula secciones — en la plataforma se usa para rótulos de sección de fichas y cabeceras de tabla cuando aplique. En móvil ningún texto baja de 14px.

## Layout & Spacing

Escala Tailwind heredada. Móvil paseador: una columna, gutter 16px, táctil ≥48px. Admin desktop: `max-w-6xl` (72rem, como el container del demo), gutter 24px. Secciones de marketing (portada): padding vertical generoso (~5rem). Cards con padding 24px (demo: 1.5rem).

## Elevation & Depth

Sombras del demo: cards `0 1px 2px rgba(0,0,0,0.05)` (sutilísima); el botón primario lleva su sombra emerald característica `0 10px 15px -3px rgba(6,78,59,0.4)`; la card destacada (plan recomendado, etapa en curso) usa **ring emerald suave** (`0 0 0 2px {colors.primary-soft}`) en vez de sombra dura. La jerarquía la dan fondo neutral-50 vs. card blanca + ring.

## Shapes

- **Botones y badges: PILL** (`{rounded.pill}`) — la firma visual de la landing.
- **Cards: `{rounded.card}` (24px, rounded-3xl)** — esquinas muy generosas.
- **Inputs: `{rounded.input}` (8px)** — moderados, altura 44px.
- Base shadcn `--radius: 0.75rem` (los `rounded-2xl/3xl` de Tailwind escalan desde ahí).

## Components

Todos extienden shadcn — `src/components/ui/` no se edita a mano.

- **Button** — primario = `{components.button-primary}` (pill emerald-700, blanco, sombra emerald, hover emerald-600). Acciones de avance ("Continuar") = el mismo pill primario (sistema de UN acento — ya no existe el azul mar). `destructive` pill red-600. Ghost sobre oscuro (portada): `rgba(255,255,255,0.05)` + borde blanco 30% + blur (patrón del demo).
- **Card** — `{components.card}` (rounded-3xl, borde neutral-200, sombra mínima). Destacada = `{components.card-destacada}` (ring emerald-100 — patrón "Recomendado" del demo). Etapa BLOQUEADA: opacity 0.55.
- **Badge** — pills con vocabulario fijo: certificado/aprobado = emerald suave + emerald-800; informativo = igual familia; neutro = neutral-100 + neutral-600; alerta = ámbar + tinta. El badge "Recomendado" de cards de plan: fondo emerald-700, blanco, 10px uppercase (demo).
- **Table** (admin) — header 12px uppercase tracking neutral-600, filas borde neutral-200, hover neutral-50.
- **Input** — `{components.input}`: 44px, borde neutral-300, focus emerald + halo 3px 25%.
- **Progress** — pista emerald-100, relleno emerald-700, siempre con dato textual.
- **Listas con check/bullet** (contenido, planes): `✓`/`●` en emerald-700, texto neutral-700 (patrón check-list/bullet-list del demo).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Emerald como ÚNICA familia de acento; neutros para el resto | Segundos acentos (azules, morados) — el dual Menta & Mar quedó superseded |
| Botones pill (rounded-full) con sombra emerald | Botones rectangulares o sombras genéricas grises |
| Títulos semibold (600) tracking -0.025em | Bold/extrabold o tracking normal en titulares |
| Cuerpo de texto en neutral-700 | Negro puro (#000/#171717) en párrafos |
| Botón primario emerald-700 + blanco (AA 4.54:1), hover emerald-600 | Blanco sobre emerald-600 como base (3.3:1 — falla AA) |
| Eyebrows uppercase tracking 0.3em para rotular secciones | Rotular con headings genéricos grises |
| Huella 🐾 e iconos Lucide de mascotas como acentos puntuales | Fotos de stock pesadas; huellas como tapiz |
| Extender shadcn vía variables en `globals.css` | Editar `src/components/ui/` a mano |
| Texto ≥14px y táctil ≥48px en móvil | Controles chicos en la app del paseador |
