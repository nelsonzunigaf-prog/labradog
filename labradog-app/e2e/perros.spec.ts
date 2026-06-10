import { expect, test } from '@playwright/test';
import { USUARIOS_PRUEBA } from './global-setup';

/**
 * E2E de Story 1.6 — ficha del perro con compatibilidades. Un solo login
 * (Neon free-tier). Viewport desktop: el área admin es desktop-first.
 * SIN subir foto (no depender de R2; el canvas tampoco corre fiable en headless).
 */
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

test('admin agrega 2 perros a un tutor, marca compatibilidad bidireccional y la quita', async ({
  page,
}) => {
  const { email, password } = USUARIOS_PRUEBA.admin;
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

  // Crear el tutor contenedor (nombre único por corrida)
  const tutorNombre = `Tutor E2E ${Date.now()}`;
  await page.goto('/admin/tutores');
  await page.getByLabel('Nombre').fill(tutorNombre);
  await page.getByLabel('Teléfono').fill('+56933334444');
  await page.getByLabel('Dirección de retiro').fill('Av. Perros 789');
  await page.getByRole('button', { name: 'Crear ficha' }).click();
  await expect(page.getByRole('heading', { name: tutorNombre }).first()).toBeVisible({
    timeout: 15000,
  });

  // AC1: agregar perro 1 (con notas críticas). #perro-nombre evita la ambigüedad
  // con el campo Nombre del form del tutor (ambos viven en la misma página).
  await page.locator('#perro-nombre').fill('Kira E2E');
  // exact: 'Raza' también matchea 'Grupo de raza' por substring (strict mode)
  await page.getByLabel('Raza', { exact: true }).fill('Border Collie');
  await page.getByLabel('Grupo de raza').selectOption('pastora');
  await page.getByLabel('Talla').selectOption('mediana');
  await page.getByLabel('Notas de manejo').fill('Reactiva a motos.');
  await page.getByRole('checkbox', { name: /Notas críticas/ }).check();
  await page.getByRole('button', { name: 'Agregar perro' }).click();
  await expect(page.getByText('Perro agregado.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kira E2E' })).toBeVisible();

  // AC1: agregar perro 2
  await page.locator('#perro-nombre').fill('Rocky E2E');
  await page.getByLabel('Raza', { exact: true }).fill('Labrador');
  await page.getByLabel('Grupo de raza').selectOption('caza');
  await page.getByLabel('Talla').selectOption('grande');
  await page.getByRole('button', { name: 'Agregar perro' }).click();
  await expect(page.getByRole('link', { name: 'Rocky E2E' })).toBeVisible();

  // Abrir perro 1 → marcar compatibilidad con perro 2 (AC4)
  await page.getByRole('link', { name: 'Kira E2E' }).click();
  await expect(page.getByRole('heading', { name: 'Kira E2E' })).toBeVisible({ timeout: 15000 });
  await page.getByLabel('Marcar compatibilidad con').selectOption({ label: 'Rocky E2E' });
  await page.getByRole('button', { name: 'Marcar' }).click();
  await expect(page.getByText('Compatibilidad registrada.')).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Compatible con Rocky E2E' }),
  ).toBeVisible();

  // AC4 bidireccional: desde el OTRO perro también se ve
  await page.goto(`/admin/tutores`);
  await page.getByRole('link', { name: tutorNombre }).click();
  await page.getByRole('link', { name: 'Rocky E2E' }).click();
  await expect(page.getByRole('heading', { name: 'Rocky E2E' })).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Compatible con Kira E2E' }),
  ).toBeVisible();

  // AC5: historial con estados vacíos
  await expect(page.getByText('Aún no hay paseos registrados.')).toBeVisible();
  await expect(page.getByText('Sin incidentes registrados.')).toBeVisible();
  await expect(page.getByText('Sin registros de estado emocional.')).toBeVisible();

  // Quitar la compatibilidad desde el lado de Rocky → desaparece
  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(page.getByText('Compatibilidad quitada.')).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Compatible con Kira E2E' }),
  ).not.toBeVisible();
});
