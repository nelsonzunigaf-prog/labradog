// Seed del PRIMER admin (Story 1.2) — sin pasar por el registro público
// (que está deshabilitado con disableSignUp).
//
// Uso:
//   node scripts/crear-admin.mjs --confirmar \
//     --email admin@labradog.cl --password "<segura>" --nombre "Nelson"
//   (o vía env: CREAR_ADMIN_EMAIL / CREAR_ADMIN_PASSWORD / CREAR_ADMIN_NOMBRE)
//
// Crea las filas `user` (rol=admin, estado=activo) y `account` (proveedor
// 'credential', con el hash de contraseña) tal como las arma Better Auth, más
// un registro en `event_log` con actor 'sistema'. El hash usa `hashPassword` del
// MISMO paquete better-auth, garantizando que el login luego lo verifique.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from 'better-auth/crypto';

function arg(nombre) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

if (!process.argv.includes('--confirmar')) {
  console.error(
    'Este script CREA un admin en la base de datos.\n' +
      'Ejecútalo con --confirmar, por ejemplo:\n' +
      '  node scripts/crear-admin.mjs --confirmar --email admin@labradog.cl --password "..." --nombre "Nelson"',
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida (ver .env.example)');
  process.exit(1);
}

const email = (arg('email') ?? process.env.CREAR_ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = arg('password') ?? process.env.CREAR_ADMIN_PASSWORD ?? '';
const nombre = arg('nombre') ?? process.env.CREAR_ADMIN_NOMBRE ?? 'Admin';

if (!email || !password) {
  console.error('Faltan --email y/o --password (o sus variables de entorno).');
  process.exit(1);
}
if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const existentes = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  if (existentes.length > 0) {
    console.error(`Ya existe una cuenta con el email ${email}. Aborto.`);
    process.exit(1);
  }

  const userId = randomUUID();
  const accountId = randomUUID();
  const hash = await hashPassword(password);

  await sql.transaction([
    sql`
      INSERT INTO "user" (id, name, email, email_verified, rol, estado)
      VALUES (${userId}, ${nombre}, ${email}, false, 'admin', 'activo')
    `,
    sql`
      INSERT INTO account (id, user_id, account_id, provider_id, password)
      VALUES (${accountId}, ${userId}, ${userId}, 'credential', ${hash})
    `,
    sql`
      INSERT INTO event_log (tipo, entidad, entidad_id, payload, actor_id, actor_rol)
      VALUES ('admin_creado', 'user', ${userId}, ${JSON.stringify({ email, via: 'seed' })}, 'sistema', 'sistema')
    `,
  ]);

  console.log(`✅ Admin creado: ${email} (id ${userId}). Ya puede iniciar sesión.`);
} catch (error) {
  console.error('❌ Falló la creación del admin:', error.message);
  process.exit(1);
}
