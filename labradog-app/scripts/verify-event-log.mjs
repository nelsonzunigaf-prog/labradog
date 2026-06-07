// Verificación one-shot del event_log (Story 1.1 review):
// inserta el evento real 'sistema_inicializado' y comprueba que UPDATE/DELETE
// son rechazados por el trigger de inmutabilidad.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

try {
  const [fila] = await sql`
    INSERT INTO event_log (tipo, entidad, entidad_id, payload, actor_id, actor_rol)
    VALUES ('sistema_inicializado', 'sistema', '0', '{"version":"0.1.0"}', 'sistema', 'sistema')
    RETURNING id
  `;
  console.log(`✅ INSERT ok (id ${fila.id})`);

  try {
    await sql`UPDATE event_log SET tipo = 'hackeado' WHERE id = ${fila.id}`;
    console.error('❌ UPDATE pasó — el trigger NO funciona');
    process.exit(1);
  } catch (e) {
    console.log(`✅ UPDATE rechazado: ${e.message}`);
  }

  try {
    await sql`DELETE FROM event_log WHERE id = ${fila.id}`;
    console.error('❌ DELETE pasó — el trigger NO funciona');
    process.exit(1);
  } catch (e) {
    console.log(`✅ DELETE rechazado: ${e.message}`);
  }
} catch (error) {
  console.error('❌ Falló:', error.message);
  process.exit(1);
}
