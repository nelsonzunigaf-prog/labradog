import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 1.3 — gestión de cuentas del equipo.
 *
 * Un solo login de admin para todo el flujo (la BD es Neon free-tier; repetir
 * logins satura las conexiones y vuelve la suite flaky). Viewport desktop: el
 * área admin es desktop-first (la tabla de 5 columnas no cabe en móvil).
 */
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

test('admin gestiona el equipo: listar, crear, auto-desactivación bloqueada y desactivar', async ({
  page,
}) => {
  // Login admin (una sola vez). 30s: cold-start de Neon free-tier.
  const { email, password } = USUARIOS_PRUEBA.admin;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

  await page.goto('/admin/equipo');
  await expect(page.getByRole('heading', { name: 'Equipo' })).toBeVisible();

  // AC1: el paseador sembrado aparece en el listado
  await expect(page.getByText(USUARIOS_PRUEBA.paseador.email)).toBeVisible();

  // AC6: el admin no puede desactivar su propia cuenta (botón deshabilitado)
  const filaAdmin = page.getByRole('row', { name: new RegExp(USUARIOS_PRUEBA.admin.email) });
  await expect(filaAdmin.getByRole('button', { name: 'Desactivar' })).toBeDisabled();

  // AC1: crear una cuenta nueva (email único por corrida) → aparece en el listado
  const nuevoEmail = `e2e-${Date.now()}@labradog.cl`;
  await page.getByLabel('Nombre').fill('Cuenta E2E');
  await page.getByLabel('Email').fill(nuevoEmail);
  await page.getByLabel('Rol').selectOption('paseador');
  await page.getByRole('button', { name: 'Crear e invitar' }).click();
  await expect(page.getByText('Se envió la invitación por email.')).toBeVisible();
  await expect(page.getByText(nuevoEmail)).toBeVisible();

  // AC3: desactivar una cuenta → queda inactiva
  page.on('dialog', (d) => d.accept());
  const filaDesactivable = page.getByRole('row', {
    name: new RegExp(USUARIOS_PRUEBA.desactivable.email),
  });
  await filaDesactivable.getByRole('button', { name: 'Desactivar' }).click();
  await expect(filaDesactivable.getByText('inactivo', { exact: true })).toBeVisible();
});

test('AC3: un usuario desactivado no puede iniciar sesión', async ({ request }) => {
  // La cuenta 'desactivable' quedó inactiva en el test anterior (serial).
  const resp = await request.post('/api/auth/sign-in/email', {
    data: {
      email: USUARIOS_PRUEBA.desactivable.email,
      password: USUARIOS_PRUEBA.desactivable.password,
    },
  });
  expect(resp.ok()).toBeFalsy();
});
