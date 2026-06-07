import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN, // sin DSN el SDK queda inactivo (local)
  tracesSampleRate: 0, // solo errores en v1 — sin tracing (free tier)
  enableLogs: false,
});
