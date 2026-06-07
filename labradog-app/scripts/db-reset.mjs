// ⚠️ DESTRUCTIVO: borra TODO el contenido de la BD (uso: node scripts/db-reset.mjs)
// Equivalente ejecutable de scripts/db-reset.sql (raíz del repo).
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`DROP SCHEMA public CASCADE`;
await sql`CREATE SCHEMA public`;
await sql`GRANT ALL ON SCHEMA public TO public`;

const restantes = await sql`
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
`;
console.log(`Reset completo. Tablas restantes en public: ${restantes.length}`);
