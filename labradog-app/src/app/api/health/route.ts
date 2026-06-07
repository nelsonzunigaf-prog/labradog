/**
 * Healthcheck — usado por Railway (Healthcheck Path: /api/health).
 * 200 = app y BD operativas · 503 = app arriba pero BD inaccesible.
 */
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = { app: 'ok' };
  let healthy = true;

  try {
    // Import dinámico: si DATABASE_URL no está definida, el módulo lanza
    // y el healthcheck lo reporta en vez de tumbar la app entera.
    const { db } = await import('@/lib/db');
    await db.execute(sql`select 1`);
    checks.db = 'ok';
  } catch {
    checks.db = 'error';
    healthy = false;
  }

  return Response.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  );
}
