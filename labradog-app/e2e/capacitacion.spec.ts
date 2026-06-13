import { neon } from '@neondatabase/serverless';
import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 2.2 — navegación de etapas con desbloqueo secuencial.
 * Vista del paseador → proyecto mobile-chrome (default), serial, un login.
 *
 * Datos: este spec crea la ficha de paseador.test vía SQL (no depende de
 * paseadores.spec, que corre DESPUÉS alfabéticamente) y la elimina completa en
 * afterAll — paseadores.spec necesita que paseador.test quede SIN ficha.
 */
test.describe.configure({ mode: 'serial' });

const sql = neon(process.env.DATABASE_URL!);
let fichaId: string;

test.beforeAll(async () => {
  const [cuenta] = await sql`
    SELECT id FROM "user" WHERE email = ${USUARIOS_PRUEBA.paseador.email}
  `;
  if (!cuenta) {
    throw new Error('paseador.test no está sembrado — el global-setup no corrió contra esta BD');
  }
  const filas = await sql`
    INSERT INTO paseadores (user_id, telefono, comision_pct, created_by, updated_by)
    VALUES (${cuenta.id}, '+56900000000', 70, 'sistema', 'sistema')
    ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
    RETURNING id
  `;
  fichaId = filas[0].id;
  await sql`DELETE FROM aprobaciones_etapa WHERE paseador_id = ${fichaId}`;
});

test.afterAll(async () => {
  // Limpieza total: aprobaciones (FK restrict) y la ficha — paseadores.spec
  // espera la cuenta sin ficha. Si beforeAll falló antes de crear la ficha,
  // no hay nada que limpiar.
  if (!fichaId) return;
  await sql`DELETE FROM aprobaciones_etapa WHERE paseador_id = ${fichaId}`;
  await sql`DELETE FROM paseadores WHERE id = ${fichaId}`;
});

test('paseador navega su capacitación con desbloqueo secuencial (FR-011)', async ({ page }) => {
  const { email, password } = USUARIOS_PRUEBA.paseador;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/paseador/, { timeout: 30000 });

  // Desde "Mi día" → Mi capacitación vía la bottom-nav del shell (Story 2.8)
  await page.getByRole('link', { name: 'Mi capacitación', exact: true }).click();
  await expect(page).toHaveURL(/\/paseador\/mi-capacitacion/);

  // AC1/AC4: 10 etapas, avance 0, solo la 1 abrible
  await expect(page.getByTestId('avance')).toHaveText('0 de 10 etapas aprobadas');
  await expect(page.getByText(/Módulo razas · /)).toBeVisible();
  await expect(page.getByText('Razas, temperamento y PPAA')).toBeVisible();
  await expect(page.getByTestId('etapa-1')).toBeVisible(); // actual → link
  await expect(page.getByTestId('etapa-2')).toHaveCount(0); // bloqueada → sin link
  await expect(page.getByTestId('etapa-10')).toHaveCount(0); // módulo razas bloqueado

  // Abrir la etapa actual → contenido markdown renderizado
  await page.getByTestId('etapa-1').click();
  await expect(page).toHaveURL(/fundamentos-del-rol/);
  await expect(
    page.getByRole('heading', { name: /Fundamentos del rol/ }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole('heading', { name: /Responsabilidad total del paseador/ }).first(),
  ).toBeVisible();

  // AC5: URL directa a una etapa bloqueada → mensaje, SIN contenido
  await page.goto('/paseador/mi-capacitacion/seguridad-y-control-basico');
  await expect(page.getByTestId('mensaje-bloqueada')).toHaveText(
    'Aprueba la etapa anterior para desbloquear esta.',
  );
  await expect(page.getByTestId('contenido-etapa')).toHaveCount(0);

  // Aprobar la etapa 1 vía SQL (las aprobaciones reales llegan en 2.3/2.4)
  const aprobacion = await sql`
    INSERT INTO aprobaciones_etapa (paseador_id, etapa_id, created_by, updated_by)
    SELECT ${fichaId}, id, 'sistema', 'sistema' FROM etapas WHERE numero = 1
    RETURNING id
  `;
  expect(aprobacion, 'la etapa 1 debe existir en BD (seed de 2.1)').toHaveLength(1);

  // La lista refleja el avance y desbloquea la etapa 2
  await page.goto('/paseador/mi-capacitacion');
  await expect(page.getByTestId('avance')).toHaveText('1 de 10 etapas aprobadas');
  await expect(page.getByTestId('etapa-1')).toBeVisible(); // aprobada → sigue abrible
  await expect(page.getByTestId('etapa-2')).toBeVisible(); // ahora actual

  // La etapa 2 ya se puede leer
  await page.getByTestId('etapa-2').click();
  await expect(
    page.getByRole('heading', { name: /Seguridad y control básico/ }),
  ).toBeVisible({ timeout: 15000 });
});
