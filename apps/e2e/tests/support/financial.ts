import { expect, type Page } from '@playwright/test';

/** Abre a tela do financeiro e seleciona a aba pelo rótulo do `SSeg`. */
export async function openFinancialTab(page: Page, label: string): Promise<void> {
  await page.goto('/financial');
  await page.getByRole('button', { name: label, exact: true }).click();
}
