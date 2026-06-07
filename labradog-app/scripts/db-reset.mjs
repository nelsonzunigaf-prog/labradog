// ⚠️ DESTRUCTIVO: borra TODO el contenido de la BD.
// Uso: node scripts/db-reset.mjs --confirmar
// Equivalente ejecutable de scripts/db-reset.sql (raíz del repo).
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.argv.includes('--confirmar')) {
  console.error(
    '⚠️  Este script BORRA TODA la base de datos.\n' +
      'Si estás seguro, ejecútalo con el flag: node scripts/db-reset.mjs --confirmar',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida (ver .env.example)');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  // Batch transaccional: o se ejecuta todo, o nada (la BD nunca queda sin schema)
  await sql.transaction([
    sql`DROP SCHEMA IF EXISTS drizzle CASCADE`,
    sql`DROP SCHEMA public CASCADE`,
    sql`CREATE SCHEMA public`,
    sql`GRANT ALL ON SCHEMA public TO public`,
  ]);

  const restantes = await sql`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  console.log(`Reset completo. Tablas restantes en public: ${restantes.length}`);
} catch (error) {
  console.error('❌ Reset falló:', error.message);
  process.exit(1);
}
