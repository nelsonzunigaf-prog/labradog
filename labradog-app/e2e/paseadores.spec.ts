import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 1.7 — ficha del paseador. Un solo login (Neon free-tier).
 * Viewport desktop: el área admin es desktop-first.
 *
 * La cuenta paseador.test se recrea en cada corrida (global-setup) y la FK de
 * paseadores es cascade → la ficha del run anterior desaparece sola: el flujo
 * de creación es repetible sin limpieza extra.
 */
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

test('admin crea la ficha del paseador, valida el rango de comisión y edita al borde', async ({
  page,
}) => {
  const { email, password } = USUARIOS_PRUEBA.admin;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

  // Listado: la cuenta paseador sembrada aparece SIN ficha
  await page.goto('/admin/paseadores');
  await expect(page.getByRole('heading', { name: 'Paseadores' })).toBeVisible();
  const filaPaseador = page.getByRole('row', { name: new RegExp(USUARIOS_PRUEBA.paseador.email) });
  await expect(filaPaseador.getByText('Crear ficha →')).toBeVisible();

  // Entrar a su ficha → badge "Sin certificar" (AC4) y form de creación
  await filaPaseador.getByRole('link', { name: USUARIOS_PRUEBA.paseador.nombre }).click();
  await expect(
    page.getByRole('heading', { name: USUARIOS_PRUEBA.paseador.nombre }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Sin certificar')).toBeVisible();

  // AC3: comisión 85 → rechazada por la validación Zod (mensaje en español)
  await page.locator('#pas-telefono').fill('+56977778888');
  await page.locator('#pas-comision').fill('85');
  await page.getByRole('checkbox', { name: 'Caminata energética' }).check();
  await page.getByRole('checkbox', { name: 'Caminata senior' }).check();
  await page.getByRole('button', { name: 'Crear ficha' }).click();
  await expect(page.getByText('La comisión va de 60 a 80')).toBeVisible();

  // AC1: comisión válida → ficha creada
  await page.locator('#pas-comision').fill('70');
  await page.getByRole('button', { name: 'Crear ficha' }).click();
  await expect(page.getByText('Ficha creada.')).toBeVisible();

  // Tras el refresh, el form pasa a modo edición con los datos guardados
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('#pas-comision')).toHaveValue('70');

  // Editar al borde superior del rango (80) → OK
  await page.locator('#pas-comision').fill('80');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Ficha actualizada.')).toBeVisible();

  // El listado refleja la ficha (especialidades + % comisión)
  await page.goto('/admin/paseadores');
  const fila = page.getByRole('row', { name: new RegExp(USUARIOS_PRUEBA.paseador.email) });
  await expect(fila.getByText('80%')).toBeVisible();
  await expect(fila.getByText(/Caminata energética/)).toBeVisible();
});
