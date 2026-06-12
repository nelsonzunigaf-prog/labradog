# Deferred Work

## Deferred from: code review of 2-1-seed-del-contenido-de-capacitacion (2026-06-12)

- El seed de capacitación solo upserta: nunca elimina filas obsoletas. Si en el futuro se renumeran/eliminan etapas o se intercambian slugs entre corridas, hará falta intervención manual o una limpieza en el script. Hoy el contenido es estable.
- `'admin_creado'` (scripts/crear-admin.mjs, Story 1.2) no está en `CatalogoEventos` de src/lib/db/eventos.ts — preexistente a la Story 2.1; mismo caso que `'capacitacion_seed_ejecutado'` (este último sí se cataloga en el patch de la 2.1).
- CHECK de cardinalidad de `alternativas` (= 3 elementos) en BD para `preguntas_examen` — requeriría una migración adicional; el invariante está cubierto por la validación del seed y el test de integridad de CI.
