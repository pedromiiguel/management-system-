import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { ADMIN } from './support/seed-data';

// Único arquivo que abre mão da sessão persistida pelo setup global — precisa
// exercitar de verdade o caminho do usuário não autenticado.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('autenticação e guarda de rota', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test('acessar uma rota protegida sem sessão redireciona para o login', async ({ page }) => {
    await page.goto('/sale');
    await expect(page).toHaveURL(/\/login/);
  });

  test('após autenticar, o usuário é levado à rota que tentou acessar originalmente', async ({
    page,
  }) => {
    await page.goto('/stock');
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Usuário').fill(ADMIN.login);
    await page.getByLabel('Senha').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/stock$/);
  });

  test('credenciais inválidas exibem erro e não criam sessão', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuário').fill(ADMIN.login);
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Login ou senha inválidos')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    // Sem sessão criada, uma rota protegida continua mandando para o login.
    await page.goto('/sale');
    await expect(page).toHaveURL(/\/login/);
  });

  test('sair encerra a sessão e devolve ao login, sem permitir voltar pelo histórico', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Usuário').fill(ADMIN.login);
    await page.getByLabel('Senha').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/sale$/);

    await page.getByRole('button', { name: 'sair' }).click();
    await expect(page).toHaveURL(/\/login/);

    // Voltar pelo histórico do navegador não deve reexibir a tela autenticada.
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);

    // E acessar a rota protegida de novo, direto, também redireciona.
    await page.goto('/sale');
    await expect(page).toHaveURL(/\/login/);
  });
});
