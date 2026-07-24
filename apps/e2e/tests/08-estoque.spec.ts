import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { openStockPage } from './support/stock';
import { PRODUCTS } from './support/seed-data';

// Suíte E2E de stock — trava a integração UI ↔ API de stock.tsx ANTES da
// refatoração estrutural (ADR 0008), mesmo espírito das suítes de products/
// financial. A guarda de estoque negativo (regra com ramificação) já está
// coberta por apps/api/test/stock.e2e-spec.ts (supertest) — aqui só se
// verifica o caminho feliz da UI (ver Decisão 4 da ADR 0008). Diferente de
// `07-produtos.spec.ts` (que só exercita o StockEntryModal pela rota
// /products), esta suíte é a primeira a exercitar a própria rota /stock —
// hoje sem cobertura alguma.

test.describe('Estoque — Movimentações e alertas', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openStockPage(page));

  test('lista as movimentações de entrada do seed', async ({ page }) => {
    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.skol.name });
    await expect(row).toContainText('Compra/reposição');
  });

  test('mostra produto abaixo do estoque mínimo no card FR-07', async ({ page }) => {
    await expect(page.getByText('Estoque abaixo do mínimo (FR-07)')).toBeVisible();
    await expect(page.getByText(PRODUCTS.zeroStock.name)).toBeVisible();
  });
});

test.describe('Estoque — Entrada de estoque avulsa (rota /stock)', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openStockPage(page));

  test('registra entrada avulsa via StockEntryModal e aparece na listagem de movimentações', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrada de estoque' }).click();
    const dialog = page.getByRole('dialog', { name: 'Entrada de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(PRODUCTS.cocaCola.name);
    await dialog.getByText(PRODUCTS.cocaCola.name).click();
    await dialog.getByTestId('entry-quantity').fill('5');
    await dialog.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.cocaCola.name }).first();
    await expect(row).toContainText('entrada');
    await expect(row).toContainText('+5');
  });

  test('entrada avulsa com validade próxima aparece no card "Vencimento próximo" (FEFO)', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrada de estoque' }).click();
    const dialog = page.getByRole('dialog', { name: 'Entrada de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(PRODUCTS.heineken.name);
    await dialog.getByText(PRODUCTS.heineken.name).click();
    await dialog.getByTestId('entry-quantity').fill('3');

    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const isoDate = soon.toISOString().slice(0, 10);
    await dialog.getByTestId('entry-expires-at').fill(isoDate);

    await dialog.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(dialog).toBeHidden();

    const expiringCard = page.locator('.s-card').filter({ hasText: 'Vencimento próximo — FEFO (FR-08)' });
    await expect(expiringCard).toBeVisible();
    await expect(expiringCard.getByText(PRODUCTS.heineken.name)).toBeVisible();
  });
});

test.describe('Estoque — Ajuste manual', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openStockPage(page));

  test('ajuste positivo aparece na listagem de movimentações', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajuste manual' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ajuste manual de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(PRODUCTS.brahma.name);
    await dialog.getByText(PRODUCTS.brahma.name).click();
    await dialog.getByPlaceholder('ex.: -3 (quebra), 10 (inventário)').fill('10');
    await dialog.getByPlaceholder('ex.: quebra, perda, contagem de inventário').fill('contagem de inventário');
    await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.brahma.name }).first();
    await expect(row).toContainText('entrada');
    await expect(row).toContainText('+10');
  });

  test('ajuste negativo válido aparece na listagem de movimentações', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajuste manual' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ajuste manual de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(PRODUCTS.skol.name);
    await dialog.getByText(PRODUCTS.skol.name).click();
    await dialog.getByPlaceholder('ex.: -3 (quebra), 10 (inventário)').fill('-5');
    await dialog.getByPlaceholder('ex.: quebra, perda, contagem de inventário').fill('quebra');
    await dialog.getByRole('button', { name: 'Registrar ajuste' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.skol.name }).first();
    await expect(row).toContainText('saída');
    await expect(row).toContainText('−5');
  });
});
