import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // 60s por test: la BD Neon free-tier hace scale-to-zero y el primer query tras
  // inactividad sufre cold-start de varios segundos (login = verify + hook + layout).
  timeout: 60_000,
  fullyParallel: true,
  // 1 worker: la BD es Neon free-tier; correr specs en paralelo satura las
  // conexiones concurrentes y vuelve los logins flaky (cada request lee estado
  // fresco de la BD). La suite es pequeña; serializar la hace determinista.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Móvil primero: el paseador opera desde el celular (NFR-02)
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
