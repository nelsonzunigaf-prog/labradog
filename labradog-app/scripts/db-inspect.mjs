// Utilidad: lista las tablas existentes en la BD (uso: node scripts/db-inspect.mjs)
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida (ver .env.example)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const filas = await sql`
    SELECT schemaname, tablename FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename
  `;
  console.log(filas.length === 0 ? 'BD VACÍA (0 tablas)' : JSON.stringify(filas, null, 1));
} catch (error) {
  console.error('❌ Consulta falló:', error.message);
  process.exit(1);
}
