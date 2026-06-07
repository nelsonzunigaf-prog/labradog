import { test, expect } from '@playwright/test';

/**
 * Smoke test del scaffold (Story 1.1).
 * Los E2E de negocio llegan en sus stories:
 * checklist-bloqueante (4.1), certificacion-gate (2.6), liquidacion (5.4).
 */

test('la app responde en /', async ({ page }) => {
  const respuesta = await page.goto('/');
  expect(respuesta?.status()).toBe(200);
});

test('/api/health responde con el contrato esperado', async ({ request }) => {
  const respuesta = await request.get('/api/health');

  // 200 (BD conectada) o 503 (sin DATABASE_URL) — ambos válidos en local;
  // en Railway el healthcheck exige 200 con la BD real conectada.
  expect([200, 503]).toContain(respuesta.status());

  const cuerpo = await respuesta.json();
  expect(cuerpo).toHaveProperty('status');
  expect(cuerpo.checks.app).toBe('ok');
  expect(['ok', 'error']).toContain(cuerpo.checks.db);
});
