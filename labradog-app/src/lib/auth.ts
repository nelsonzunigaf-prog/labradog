/**
 * Configuración de Better Auth (v1.6) — email + contraseña con roles.
 *
 * Decisiones (architecture.md#Authentication & Security):
 * - `disableSignUp: true` → NO hay auto-registro público (FR-002). Las cuentas
 *   las crea un admin (Story 1.3) o el seed `scripts/crear-admin.mjs`.
 * - Rol de sesión en `user.rol` (admin | paseador) vía additionalFields, con
 *   `input: false` para que NUNCA se pueda setear desde un request del cliente.
 * - Recuperación de contraseña vía `sendResetPassword` → `lib/email.ts` (Resend).
 * - `nextCookies()` va al FINAL del array de plugins (requisito de Better Auth
 *   para gestionar cookies en Server Actions de Next).
 */
// `better-auth/minimal`: inicializador SIN Kysely. Usamos el drizzleAdapter,
// así que el modo "full" (que arrastra @better-auth/kysely-adapter y sus
// dialectos sqlite) sobra y además rompe el build de Turbopack por un mismatch
// de versión con kysely. minimal evita toda esa cadena.
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import { account, session, user, verification } from './db/schema';
import { enviarEmail, plantillaResetPassword } from './email';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hora
    sendResetPassword: async ({ user, url }) => {
      await enviarEmail({
        to: user.email,
        subject: 'Restablece tu contraseña — Labradog',
        html: plantillaResetPassword(user.name, url),
      });
    },
  },
  user: {
    additionalFields: {
      rol: { type: 'string', required: true, input: false },
      estado: { type: 'string', required: false, input: false, defaultValue: 'activo' },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Bloqueo de login para cuentas desactivadas (Story 1.3): antes de crear
        // la sesión, si el usuario está 'inactivo' abortamos (return false) → el
        // sign-in falla. Defensa en profundidad junto al chequeo de getActor().
        //
        // Fail-open ante errores transitorios del lookup (p.ej. cold-start de
        // Neon): NO rompemos el login por un fallo del hook — getActor() sigue
        // siendo el gate real que rechaza inactivos en cada request protegido.
        before: async (sesion, context) => {
          try {
            const usuario = await context?.context?.internalAdapter?.findUserById(sesion.userId);
            if (usuario && (usuario as { estado?: string }).estado !== 'activo') {
              return false;
            }
          } catch {
            // intencional: no bloquear el login por un error transitorio del lookup
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
