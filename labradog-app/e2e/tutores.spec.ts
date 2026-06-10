import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 1.5 — ficha del tutor. Un solo login (Neon free-tier). Viewport
 * desktop: el área admin es desktop-first.
 */
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

test('admin crea una ficha de tutor, registra entrevista con 2 red flags (alerta) y un anexo', async ({
  page,
}) => {
  const { email, password } = USUARIOS_PRUEBA.admin;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

  await page.goto('/admin/tutores');
  await expect(page.getByRole('heading', { name: 'Tutores' })).toBeVisible();

  // AC1: crear ficha (nombre único por corrida) → redirige a la ficha
  const nombre = `Tutor E2E ${Date.now()}`;
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('+56911112222');
  await page.getByLabel('Dirección de retiro').fill('Av. Test 123');
  await page.getByLabel('Plan por defecto').selectOption('plus');
  await page.getByRole('button', { name: 'Crear ficha' }).click();

  // Redirige a /admin/tutores/<id> con el nombre como título
  await expect(page.getByRole('heading', { name: nombre }).first()).toBeVisible({
    timeout: 15000,
  });

  // AC3/AC4: registrar entrevista con 2 red flags → aparece la alerta de rechazo
  await page.getByLabel('Historial del perro').fill('Perro reactivo a bicicletas.');
  await page.getByRole('checkbox', { name: 'Presiona por tiempo' }).check();
  await page.getByRole('checkbox', { name: 'Oculta información' }).check();
  await expect(page.getByText('Evaluar rechazo del servicio')).toBeVisible();
  await page.getByRole('button', { name: 'Guardar entrevista' }).click();
  await expect(page.getByText('Entrevista guardada.')).toBeVisible();

  // AC5: registrar un anexo (sin PDF, para no depender de R2)
  await page.getByLabel('Tipo').selectOption('limites_servicio');
  await page.getByLabel('Fecha de aceptación').fill('2026-06-09');
  await page.getByLabel('Medio').selectOption('papel');
  await page.getByRole('button', { name: 'Registrar anexo' }).click();
  await expect(page.getByText('Anexo registrado.')).toBeVisible();
  // Scope al <li> de la lista (el texto también existe en el <option> del select).
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Límites del servicio' }),
  ).toBeVisible();

  // Vuelve al listado: la ficha aparece
  await page.goto('/admin/tutores');
  await expect(page.getByRole('link', { name: nombre })).toBeVisible();
});
