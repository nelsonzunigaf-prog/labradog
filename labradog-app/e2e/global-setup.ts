/**
 * Global setup de Playwright — siembra usuarios de prueba deterministas
 * (un admin y un paseador) en la BD real, de forma idempotente: borra por email
 * y recrea, garantizando credenciales conocidas para los E2E.
 *
 * Usa el MISMO hashPassword de Better Auth para que el login los verifique.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from 'better-auth/crypto';

export const USUARIOS_PRUEBA = {
  admin: { email: 'admin@labradog.cl', password: 'AdminLabradog123', nombre: 'Admin Prueba', rol: 'admin' },
  paseador: {
    email: 'paseador.test@labradog.cl',
    password: 'PaseadorTest123',
    nombre: 'Paseador Prueba',
    rol: 'paseador',
  },
  // Usuario dedicado al test de "desactivado no puede iniciar sesión" (Story 1.3),
  // separado de los anteriores para no interferir con auth.spec en paralelo.
  desactivable: {
    email: 'desactivable@labradog.cl',
    password: 'Desactivable123',
    nombre: 'Cuenta Desactivable',
    rol: 'paseador',
  },
} as const;

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no definida: los E2E de auth requieren la BD');
  }
  const sql = neon(process.env.DATABASE_URL);

  for (const u of Object.values(USUARIOS_PRUEBA)) {
    const userId = randomUUID();
    const accountId = randomUUID();
    const hash = await hashPassword(u.password);

    // Idempotente: borrar por email (cascade limpia account/session) y recrear.
    await sql`DELETE FROM "user" WHERE email = ${u.email}`;
    await sql.transaction([
      sql`
        INSERT INTO "user" (id, name, email, email_verified, rol, estado)
        VALUES (${userId}, ${u.nombre}, ${u.email}, false, ${u.rol}, 'activo')
      `,
      sql`
        INSERT INTO account (id, user_id, account_id, provider_id, password)
        VALUES (${accountId}, ${userId}, ${userId}, 'credential', ${hash})
      `,
    ]);
  }
}
