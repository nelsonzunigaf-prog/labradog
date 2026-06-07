-- ============================================================
-- Labradog — Reset total de la base de datos Neon
-- ⚠️ DESTRUCTIVO: borra TODAS las tablas, datos y migraciones.
-- Uso: pegar en el SQL Editor de Neon (console.neon.tech →
--      tu proyecto → SQL Editor) y ejecutar.
-- ============================================================

-- Borra el schema de migraciones de Drizzle (si existe)
DROP SCHEMA IF EXISTS drizzle CASCADE;

-- Borra todo el schema público (tablas, vistas, secuencias, enums)
DROP SCHEMA public CASCADE;

-- Lo recrea vacío y restaura permisos
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;

-- Verificación: debe retornar 0 filas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
