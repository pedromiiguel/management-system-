import { expect, type Page } from '@playwright/test';

/** Abre a tela de estoque e aguarda a listagem de movimentações carregar. */
export async function openStockPage(page: Page): Promise<void> {
  await page.goto('/stock');
  await expect(page.getByText('Movimentações recentes', { exact: true })).toBeVisible();
}
