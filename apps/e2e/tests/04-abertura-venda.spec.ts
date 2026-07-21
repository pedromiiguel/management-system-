import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { addKnownItems, ensureFreshSale, qtyInput, saleItemRow, scanInput } from './support/pos';
import { PRODUCTS } from './support/seed-data';

test.describe('abertura de venda, campo de código e busca', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await ensureFreshSale(page);
  });

  test('entrar na frente de caixa abre uma venda em andamento com o campo de código focado', async ({
    page,
  }) => {
    await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();
    await expect(scanInput(page)).toBeFocused();
  });

  test('digitar o EAN de um produto e confirmar adiciona o item à venda', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(row).toBeVisible();
    await expect(qtyInput(row)).toHaveValue('1');
  });

  test('adicionar por SKU funciona igualmente', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.brahma.sku }]);
    await expect(saleItemRow(page, PRODUCTS.brahma.name)).toBeVisible();
  });

  test('após adicionar um item, o campo de código é limpo e volta a receber foco', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await expect(scanInput(page)).toHaveValue('');
    await expect(scanInput(page)).toBeFocused();
  });

  test('o atalho de quantidade com asterisco adiciona a quantidade indicada de uma vez', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean, quantity: 3 }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(row).toBeVisible();
    await expect(qtyInput(row)).toHaveValue('3');
  });

  test('o atalho de quantidade com a letra x funciona da mesma forma', async ({ page }) => {
    await scanInput(page).fill(`4x${PRODUCTS.skol.ean}`);
    await scanInput(page).press('Enter');
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(row).toBeVisible();
    await expect(qtyInput(row)).toHaveValue('4');
  });

  test('um código inexistente abre a busca por nome preenchida, sem exibir erro', async ({
    page,
  }) => {
    await scanInput(page).fill('0000000000000');
    await scanInput(page).press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Buscar produto (F2)' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox')).toHaveValue('0000000000000');
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('digitar duas letras ou mais exibe sugestões de produto', async ({ page }) => {
    await scanInput(page).fill('Co');
    await expect(page.getByRole('option', { name: PRODUCTS.cocaCola.name })).toBeVisible();
  });

  test('as sugestões são navegáveis pelas setas e selecionáveis com Enter', async ({ page }) => {
    // "Cerveja" casa com 3 produtos, ordenados por nome: Brahma, Heineken, Skol.
    await scanInput(page).fill('Cerveja');
    await expect(page.getByRole('option', { name: PRODUCTS.brahma.name })).toBeVisible();

    await scanInput(page).press('ArrowDown'); // Brahma -> Heineken
    await scanInput(page).press('Enter');

    await expect(saleItemRow(page, PRODUCTS.heineken.name)).toBeVisible();
    await expect(saleItemRow(page, PRODUCTS.brahma.name)).toHaveCount(0);
  });
});
