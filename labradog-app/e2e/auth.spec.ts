import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 1.2 — login con roles y protección de rutas.
 * Usuarios sembrados por global-setup.ts.
 */

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

test('no autenticado en /admin → redirige a /login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('no autenticado en /paseador → redirige a /login', async ({ page }) => {
  await page.goto('/paseador');
  await expect(page).toHaveURL(/\/login/);
});

test('paseador inicia sesión y llega a /paseador', async ({ page }) => {
  const { email, password } = USUARIOS_PRUEBA.paseador;
  await login(page, email, password);
  await expect(page).toHaveURL(/\/paseador/);
  await expect(page.getByRole('heading', { name: 'Mi día' })).toBeVisible();
});

test('admin inicia sesión y llega a /admin', async ({ page }) => {
  const { email, password } = USUARIOS_PRUEBA.admin;
  await login(page, email, password);
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
});

test('paseador autenticado no puede entrar a /admin (lo redirige a /paseador)', async ({ page }) => {
  const { email, password } = USUARIOS_PRUEBA.paseador;
  await login(page, email, password);
  await expect(page).toHaveURL(/\/paseador/);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/paseador/);
});

test('credenciales inválidas muestran error y no autentican', async ({ page }) => {
  await login(page, 'admin@labradog.cl', 'claveincorrecta');
  await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
