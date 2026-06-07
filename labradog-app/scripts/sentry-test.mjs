// Dispara un error de prueba a Sentry para verificar el DSN (uso: node scripts/sentry-test.mjs)
import 'dotenv/config';
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });

const eventId = Sentry.captureException(
  new Error('Error de prueba — verificación Story 1.1 (ignorar y resolver)'),
);

const enviado = await Sentry.flush(10_000);
console.log(enviado ? `✅ Evento enviado a Sentry (id: ${eventId})` : '❌ No se pudo enviar (timeout)');
process.exit(enviado ? 0 : 1);
