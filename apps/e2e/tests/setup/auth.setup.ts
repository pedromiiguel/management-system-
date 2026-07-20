import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE } from '../../playwright.config';
import { resetDatabase } from '../support/db';
import { ADMIN } from '../support/seed-data';

// Roda uma vez, antes de qualquer arquivo do projeto "chromium" (dependencies
// no playwright.config.ts). Loga de verdade pela tela de login — o token não
// é forjado nem obtido chamando a API diretamente — e persiste o estado de
// armazenamento para os demais testes reaproveitarem.
setup('autentica uma vez e persiste a sessão', async ({ page }) => {
  resetDatabase();

  await page.goto('/login');
  await page.getByLabel('Usuário').fill(ADMIN.login);
  await page.getByLabel('Senha').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/pos$/);
  await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
