import { expect, type Page } from '@playwright/test';

/** Abre a tela de produtos e aguarda a tabela carregar. */
export async function openProductsPage(page: Page): Promise<void> {
  await page.goto('/products');
  await expect(page.getByText('Produtos & Estoque', { exact: true })).toBeVisible();
}
