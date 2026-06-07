/**
 * Conexión a Neon Postgres — driver WebSocket (`neon-serverless`) con Pool.
 *
 * Decisión (code review 1.1, registrada en architecture.md): se usa el driver
 * WebSocket y NO el HTTP porque soporta TRANSACCIONES, requisito del patrón
 * "escribir negocio + auditoría" de forma atómica (db.transaction(...)).
 * Node 22+ trae WebSocket global; Railway y local cumplen.
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
