import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = path.resolve(__dirname, '../..');
const WEB_PORT = 5173;
const API_PORT = 3000;

export const AUTH_FILE = path.join(__dirname, '.auth/operador.json');

// Suíte E2E do PDV — Playwright. Local, sob demanda, apenas Chromium. Ver
// docs/specs/0001-suite-e2e-do-pdv.md e docs/adr/0001-e2e-antes-da-refatoracao-do-front.md.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\/.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      testMatch: /tests\/.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],
  // Servidores de dev (Vite + Nest em watch) — reaproveitados quando já
  // estiverem no ar, para não pagar boot a cada rodada durante a refatoração.
  webServer: [
    {
      command: 'npm run dev:api',
      cwd: repoRoot,
      port: API_PORT,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev:web',
      cwd: repoRoot,
      port: WEB_PORT,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
