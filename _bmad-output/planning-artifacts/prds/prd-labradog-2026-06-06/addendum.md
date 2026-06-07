# Addendum — PRD Plataforma Labradog

Detalle de soporte para arquitectura y diseño; no forma parte del cuerpo del PRD.

## Esquema de comisiones — opciones consideradas (FR-036)

| Opción | Cómo funciona | Pro | Contra |
|---|---|---|---|
| **A. Fijo por paseador (elegida como base)** | Admin configura % individual (60-80) | Simple, refleja negociación real | Sin incentivo estructural |
| B. Por nivel (propuesta como default sobre A) | 60% certificado → 70% tras 100 paseos sin incidentes graves → 80% senior | Incentiva permanencia y calidad | Requiere definir umbrales con socios |
| C. Por plan | % distinto en BASE/PLUS/ELITE | Alinea esfuerzo extra de PLUS/ELITE | Complejiza liquidación y comunicación |

Decisión pendiente con socios (pregunta abierta #1). El modelo de datos debe soportar A con defaults de B (el % se fija por paseo al completarse, así los cambios de % no reescriben historia).

## Modalidades de cobro (FR-033) — implicancias

- Combinaciones: {por paseo, semanal, mensual} × {prepago, postpago} = 6 modalidades posibles por tutor.
- Prepago implica saldo/paquete: paseos contratados vs consumidos (control de saldo restante y aviso de agotamiento al admin).
- Postpago implica corte de período y cobrable acumulado.
- El precio por paseo se congela al momento del paseo (cambios de tarifa no afectan paseos pasados).

## Formato de reportes por plan (FR-031) — insumo para diseño

- **BASE:** cómo se portó, energía, pipí/caca, incidentes si hubo (fuente: PLAN BASE.docx).
- **PLUS:** BASE + "logros del día" (estimulación/comandos) + 1-2 fotos (fuente: PLAN PLUS.docx).
- **ELITE:** reporte profesional: conducta, energía, encuentros, observaciones (fuente: PLAN ELITE.docx). GPS y video quedan post-v1 pero el formato debe dejar espacio.

## Taxonomías del método (para el modelo de datos)

- Estados emocionales: calma / excitación / estrés / ansiedad-miedo (etapa 3).
- Tipos de incidente: escape / pelea / mordida / lesión / crisis de pánico (etapa 6).
- Grupos de raza operativos: trabajo-guardia / pastora / caza / otro (módulo razas).
- Red flags de tutor: minimiza conductas, insiste en soltar correa, presiona por tiempo, oculta información, desautoriza criterio, rechaza protocolos (etapa 7) — 2+ → sugerir rechazo.
- Checklist pre-paseo: ítems de "antes de salir" y "antes de partir" (etapa 8 / PLANTILLA DE REGISTRO DE PASEOS).

## Volúmenes esperados (fase de prueba)

- 30 tutores, ~35-40 perros, 3-4 paseadores + 2-3 admins.
- 60-90 paseos/semana → ~300-400/mes → ~5.000/año. Volumen muy bajo: cualquier base de datos relacional simple sobra; priorizar simplicidad sobre escalabilidad.

## Pendientes que vienen del brief

- Botón de pago post-prueba: Webpay Plus / MercadoPago / Flow / Khipu (evaluar en arquitectura, no en v1).
- WhatsApp Business API post-prueba (envío automático de reportes).
- Portal tutor post-prueba: magic links / sin contraseña (cliente con poco tiempo).
