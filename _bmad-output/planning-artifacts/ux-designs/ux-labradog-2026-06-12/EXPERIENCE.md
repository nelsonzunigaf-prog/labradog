---
name: Labradog
status: final
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-labradog-2026-06-12/.decision-log.md
  - labradog-app/project-context.md
updated: 2026-06-12
---

# Labradog — Experience Spine

## Foundation

Multi-surface: **paseador = móvil en la calle** (su única superficie real — sol, correa en la otra mano, micro en movimiento) y **admin = desktop** con móvil funcional. shadcn/ui sobre Next.js 16 + Tailwind 4; `DESIGN.md` (tema Menta & Mar) define la identidad visual y los tokens — este spine define la experiencia. Herramienta interna (equipo Labradog + paseadores), pero representa una marca de servicio premium: nada puede verse "por defecto". Dark mode fuera de alcance v1.

## Information Architecture

**Regla dura del app shell:** toda pantalla no-raíz tiene "← volver" en la MISMA posición — arriba a la izquierda, primera fila del contenido, zona táctil ≥48px. Sin excepciones; ninguna pantalla es un callejón.

### Paseador (móvil)

| Superficie | Se llega desde | Propósito |
|---|---|---|
| Mi día 🐾 (`/paseador`) | Bottom-nav / login | Paseos de hoy, próximo paseo destacado |
| Mi capacitación 🎓 (`/paseador/mi-capacitacion`) | Bottom-nav | Progreso + lista de etapas (aprobada/en curso/bloqueada) |
| Etapa (`/mi-capacitacion/[slug]`) | Fila de etapa | Contenido de la etapa; ← volver a Mi capacitación |
| Próximos: test de etapa, examen, checklist pre-paseo, registro post-paseo | Botón de avance en su contexto | Flujos lineales, un paso por pantalla |

**Bottom-nav fija** con Mi día 🐾 y Mi capacitación 🎓; ítem activo en {colors.primary-deep} con etiqueta visible. [ASSUMPTION] Agenda y Comisiones se sumarán a la bottom-nav como ítems 3 y 4 cuando lleguen sus epics — máximo 4 ítems; si aparece un quinto, el último se vuelve "Más".

### Admin (desktop)

| Superficie | Se llega desde | Propósito |
|---|---|---|
| Home (`/admin`) | Login | Resumen operativo |
| Equipo · Tutores · Perros · Paseadores · Capacitación | Header horizontal | Listas maestras |
| Fichas (`/admin/tutores/[id]`, `/admin/perros/[id]`, `/admin/paseadores/[userId]`) | Fila de lista | Detalle + relaciones |
| Próximos: tablero capacitación, agendas, cobros | Header | Operación diaria |

**Header con navegación horizontal** persistente (Equipo · Tutores · Perros · Paseadores · Capacitación); sección activa subrayada en {colors.primary}. Toda ficha muestra **breadcrumb** (`Tutores / María Pérez`) además del ← volver. Portada y login: sin shell — logo, huella y una sola acción.

Modales: máximo un nivel; confirmaciones destructivas vía `AlertDialog` de shadcn.

## Voice and Tone

es-CL, tutea, cercano pero profesional. Microcopy corta, concreta, sin signos de exclamación gratuitos.

| Do | Don't |
|---|---|
| "Aprueba la etapa anterior para desbloquear esta" | "Etapa bloqueada ❌" |
| "Este registro cambió, recarga" | "Error de concurrencia (409)" |
| "3 de 10 etapas aprobadas" | "Progreso: 30.00%" |
| "¡Etapa aprobada! Se desbloqueó la Etapa 5" | "Operación exitosa" |
| "Aún no tienes paseos para hoy" | "No data available" |
| "Guardando… / Guardado ✓" siempre visible | Guardar en silencio sin feedback |

Datos chilenos: montos `$12.000` (CLP enteros, punto de miles), fechas en `America/Santiago` ("hoy", "mañana", "lun 15 jun").

## Component Patterns

Conductuales — lo visual vive en `DESIGN.md.Components`. Las reglas del paseador vienen de project-context.md elevadas a patrón:

| Componente | Uso | Reglas de comportamiento |
|---|---|---|
| Fila táctil | Listas móviles (etapas, paseos) | ≥48px de alto, toda la fila es tocable (no solo el chevron), una acción por toque |
| Botón de avance | "Continuar", "Comenzar test" | Pill {components.button-advance}; siempre visible sin scroll en la pantalla donde aplica |
| Card de etapa | Mi capacitación | Tres estados visuales: aprobada (✓ éxito), en curso (borde primario + botón avance), bloqueada (atenuada, microcopy de desbloqueo, NO navegable) |
| Notas críticas del perro | Checklist pre-paseo, ficha | Visibles SIN scroll, primero en el orden de lectura, fondo {colors.warning} con tinta oscura |
| Dirección | Paseo, ficha tutor | Tap abre Maps directamente — nunca copiar a mano |
| Formularios móviles | Registro post-paseo | Teclado solo si el usuario lo invoca: opciones predefinidas (chips/botones) antes que texto libre |
| Feedback de guardado | Toda mutación | Estado visible: "Guardando…" → "Guardado ✓" (≥800ms) o error con reintento; nunca silencio |
| Tabla admin | Listas desktop | Fila completa clickeable → ficha; orden y filtros persisten al volver |
| Badge de estado | Todas | Vocabulario fijo de DESIGN.md: certificado=éxito, sin certificar=neutro, bloqueada=atenuada, inactivo=neutro apagado |

## State Patterns

| Estado | Superficie | Tratamiento |
|---|---|---|
| Cargando | Listas | `Skeleton` shadcn calcando el layout esperado (3–5 filas) |
| Vacío | Mi día | "Aún no tienes paseos para hoy 🐾" + nada más — el vacío es información, no error |
| Vacío | Listas admin | "Todavía no hay {entidad}." + botón primario "Agregar {entidad}" |
| Bloqueado | Etapa de capacitación | Card atenuada (opacity 0.55), "Aprueba la etapa anterior para desbloquear esta"; el tap NO navega |
| Error de guardado | Formularios | Mensaje en {colors.destructive-text} junto al botón + "Reintentar"; lo escrito se conserva |
| Conflicto de versión | Fichas admin (lock optimista) | "Este registro cambió, recarga" + botón "Recargar"; nunca pisar datos en silencio |
| Error de carga | Detalle | "No pudimos cargar esto. Reintentar" — sin stack traces ni códigos |
| Sin permiso | Cualquiera | Redirección por rol al home propio; nunca pantalla "prohibido" |

## Interaction Primitives

**Móvil (paseador):** un toque para actuar; sin gestos ocultos (nada de swipe-to-action en v1); teclado solo si se invoca; scroll vertical único — nada horizontal; pull-to-refresh solo en Mi día. **Desktop (admin):** click en fila → ficha; `Esc` cierra el modal superior; formularios envían con `Enter` desde el último campo.

**Prohibido en todas partes:** scroll infinito (paginación), hover como única vía a una acción, modales sobre modales, doble toque o long-press como gesto requerido, autoguardado sin indicador.

## Accessibility Floor

- **Contraste AA sobre los pasteles — verificado:** el menta {colors.primary} con texto blanco da 2.2:1 y FALLA; el contrato es tinta oscura {colors.primary-foreground} sobre menta (4.6:1) y {colors.primary-deep} cuando el menta es texto (4.9:1). Botones mar sólidos con texto normal usan {colors.secondary-deep} (5.9:1). Texto de error sobre blanco: {colors.destructive-text} (5.4:1).
- Touch ≥48px en toda la superficie del paseador (controles, filas, bottom-nav).
- Foco visible siempre: anillo {colors.ring} de 2px; jamás `outline: none` sin reemplazo.
- Orden de `Tab` = orden de lectura; ← volver es el primer elemento enfocable de cada pantalla no-raíz.
- Estados nunca solo por color: bloqueada = atenuada + candado + microcopy; aprobada = ✓ + texto.
- `aria-live` para el feedback de guardado y los cambios de progreso.
- Textos ≥14px en móvil (regla de DESIGN.md, también es legibilidad a pleno sol).

## Key Flows

### Flujo 1 — Caro aprueba su etapa (paseadora nueva, en la micro camino a su primer paseo)

1. Caro abre la app en su teléfono; la sesión persiste — cae directo en **Mi día 🐾**.
2. Toca **Mi capacitación 🎓** en la bottom-nav. Arriba, la card de progreso: "3 de 10 etapas aprobadas · 30%". Abajo, las etapas: la 1–3 con ✓ verde, la **Etapa 4 · Decisiones en tiempo real** con borde menta y pill "Continuar", la 5 atenuada: "Se desbloquea al aprobar la etapa 4".
3. Toca "Continuar" (un toque, ≥48px, la micro frena y no le importa). Entra a la etapa con "← volver" arriba a la izquierda, donde siempre.
4. Termina el contenido y toca "Comenzar test". Responde tocando alternativas — el teclado nunca aparece. Cada respuesta marca "Guardado ✓".
5. **Clímax:** envía el test. "¡Etapa aprobada! Se desbloqueó la Etapa 5". Vuelve a Mi capacitación: la Etapa 4 ahora tiene su ✓, la barra dice "4 de 10 · 40%", y la **Etapa 5 perdió la atenuación y ganó el pill "Continuar"**. El sistema le mostró, no le contó, que avanzó. Guarda el teléfono: llegó a su paradero.

Fallo: la señal se corta al enviar → "No pudimos guardar tu test. Reintentar" — sus respuestas se conservan; un toque reintenta.

### Flujo 2 — Nelson incorpora a un paseador nuevo (admin, desktop, lunes en la mañana)

1. Nelson entra a `/admin`; el header muestra Equipo · Tutores · Perros · Paseadores · Capacitación.
2. Va a **Equipo** y crea la cuenta del paseador nuevo (rol paseador). "Guardado ✓".
3. Sigue a **Paseadores** → la fila nueva aparece con badge neutro "Sin certificar" y progreso 0%. Click en la fila → ficha `/admin/paseadores/[userId]` con breadcrumb `Paseadores / Diego Soto` y ← volver.
4. En la ficha ve los datos y la sección de capacitación: 9 etapas, todas pendientes, Etapa 1 lista para que Diego parta.
5. **Clímax:** le avisa a Diego por WhatsApp. Esa tarde refresca la ficha: "1 de 9 etapas · 11%", la Etapa 1 con ✓. La misma fuente de verdad que ve Diego en su teléfono la ve Nelson en su escritorio — sin planillas paralelas ni preguntar "¿cómo vas?".

Fallo: otro admin editó la ficha mientras Nelson la tenía abierta → al guardar: "Este registro cambió, recarga" — recarga y reaplica; nada se pisa en silencio.

## Responsive & Platform

| Breakpoint | Paseador | Admin |
|---|---|---|
| `< md` (móvil) | Superficie nativa: bottom-nav fija, una columna, gutter 16px | Funcional (NFR-02): el header horizontal colapsa a menú `Sheet` [ASSUMPTION]; las tablas colapsan a cards apiladas con los 2–3 datos clave |
| `md` (768–1023) | Igual que móvil, centrado `max-w-md` [ASSUMPTION] | Tablas completas si caben; si no, columnas secundarias se ocultan |
| `≥ lg` (1024+) | No es superficie objetivo — se sirve la vista móvil centrada | Superficie nativa: header completo, breadcrumbs, tablas anchas, `max-w-6xl` |

El paseador NUNCA depende de hover; el admin puede usarlo solo como refuerzo (nunca como única vía a una acción).
