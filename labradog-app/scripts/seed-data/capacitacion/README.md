# Seed de contenido de capacitación

Contenido canónico del programa **"Paseador de Perros Profesional – Entorno Urbano"**, curado desde los documentos Word de `archivos del proyecto\` (junio 2026). Es la fuente que consume `scripts/seed-capacitacion.ts` (Story 2.1).

## Estructura

| Archivo | Contenido | Lo consume |
|---|---|---|
| `programa.json` | Manifest: etapas, duraciones, tipo de evaluación, principios del programa | Story 2.1 / 2.2 |
| `etapas/*.md` | Contenido navegable de las 9 etapas + módulo razas (markdown) | Story 2.2 |
| `tests.json` | Tests V/F de etapas 1, 2, 3 y 5 (30 preguntas c/u, con respuesta y unidad) | Story 2.3 |
| `banco-examen.json` | Banco de 100 preguntas de alternativas para el examen final | Story 2.5 |
| `pautas/*.md` | Pautas de evaluaciones prácticas (etapas 4, 6, 7, 8) | Story 2.4 |

En `banco-examen.json`, `correcta` es el **índice 0-based** dentro de `alternativas`.

## Decisiones editoriales (vs. los Word originales)

1. **Duración total: 2–3 horas** (indicación de Nelson, jun-2026). El Word decía 20–30 horas; se reescalaron las duraciones por etapa a minutos de lectura en plataforma. Las evaluaciones prácticas presenciales se agendan aparte.
2. **Módulo de razas:** el Word lo ubica entre las etapas 3 y 4; el PRD (FR-011) lo desbloquea al aprobar la etapa 9. **Manda el PRD.**
3. **Tipos de evaluación por etapa** según las épicas: tests autocorregibles en 1, 2, 3 y 5 (Story 2.3); prácticas registradas por admin en 4, 5 (práctica), 6, 7 y 8 (Story 2.4); examen final en 9 (Story 2.5).
4. **Pregunta 3 del banco** reformulada: el original preguntaba "¿Qué elemento NO elimina la responsabilidad?" con respuesta "Todos los anteriores" (ambiguo). Ahora: "¿Cuál de estos elementos elimina la responsabilidad...?" → "Ninguno de los anteriores".
5. **Pregunta 69 del banco** corregida: el original marcaba dos alternativas como correctas ("Previene conflictos" y "Ambas (✔)"). Ahora la correcta es "Ambas son correctas".
6. **Etapa 4:** el Word solo traía el listado de las 5 preguntas de decisión; el contenido de la etapa se redactó integrando esos ejes con los criterios de las etapas 1–3 (sin agregar doctrina nueva). Los 30 ejercicios van en la pauta.
7. La extracción cruda de los Word quedó en `_bmad-output/capacitacion-extraida/` como referencia de trazabilidad.

## Principios del método (presentes en todo el contenido)

- El bienestar del perro y la seguridad están por sobre el horario, la comodidad y las exigencias del tutor.
- La seguridad no se improvisa: se planifica y se ejecuta con criterio.
- Transparencia total: los incidentes se informan siempre.
- El paseador profesional no busca agradar; busca proteger.
