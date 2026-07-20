import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { brl, cupomBrl } from './support/format';
import {
  addKnownItems,
  decreaseQtyButton,
  ensureFreshSale,
  increaseQtyButton,
  qtyInput,
  removeItemButton,
  saleItemRow,
  totalValue,
} from './support/pos';
import { PRODUCTS } from './support/seed-data';

test.describe('quantidade — estado otimista, debounce e flush', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await ensureFreshSale(page);
  });

  test('aumentar a quantidade reflete na tela imediatamente, sem esperar o servidor', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await increaseQtyButton(row).click();
    await expect(qtyInput(row)).toHaveValue('2');
  });

  test('cliques sucessivos e rápidos resultam na quantidade final correta, sem perder nenhum', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    const increase = increaseQtyButton(row);
    for (let i = 0; i < 4; i++) await increase.click();

    await expect(qtyInput(row)).toHaveValue('5');
  });

  test('aumentar três vezes em sequência rápida e finalizar imediatamente fecha a venda com a quantidade que estava na tela', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    const increase = increaseQtyButton(row);
    await increase.click();
    await increase.click();
    await increase.click();
    await expect(qtyInput(row)).toHaveValue('4');

    // Finaliza imediatamente após os cliques — sem esperar o debounce de
    // 400ms. flushPendingQuantity() precisa garantir que o servidor recebeu
    // a quantidade 4 antes da conclusão.
    await page.getByRole('button', { name: 'Pagamento PIX' }).click();
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    const receipt = page.getByRole('dialog', { name: 'Venda concluída ✓' });
    await expect(receipt).toBeVisible();
    await expect(receipt.locator('pre')).toContainText(cupomBrl(PRODUCTS.skol.price * 4));
  });

  test('alterar a quantidade e remover outro item em seguida preserva a alteração', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }, { code: PRODUCTS.brahma.ean }]);
    const skolRow = saleItemRow(page, PRODUCTS.skol.name);
    const brahmaRow = saleItemRow(page, PRODUCTS.brahma.name);

    await increaseQtyButton(skolRow).click();
    await expect(qtyInput(skolRow)).toHaveValue('2');

    // Remove o outro item sem esperar o debounce da quantidade assentar.
    await removeItemButton(brahmaRow).click();
    const confirmDialog = page.getByRole('dialog', { name: 'Remover item?' });
    await confirmDialog.getByRole('button', { name: 'Remover' }).click();
    await expect(brahmaRow).toHaveCount(0);

    await expect(qtyInput(skolRow)).toHaveValue('2');
    await page.reload();
    await expect(qtyInput(saleItemRow(page, PRODUCTS.skol.name))).toHaveValue('2');
  });

  test('alterar a quantidade e cancelar a venda em seguida encerra de forma limpa, sem alteração pendente', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await increaseQtyButton(row).click();

    await page.getByRole('button', { name: 'Cancelar venda' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancelar venda em andamento?' });
    await dialog.getByRole('button', { name: 'Cancelar venda' }).click();

    await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();
    await expect(page.locator('[data-testid^="sale-item-"]')).toHaveCount(0);
    await expect(page.locator('.s-toast')).toHaveCount(0);
  });

  test('alterar a quantidade e aplicar desconto em seguida calcula o desconto sobre a quantidade nova', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await increaseQtyButton(row).click();
    await increaseQtyButton(row).click();
    await expect(qtyInput(row)).toHaveValue('3');

    // Abre o desconto (F4) sem esperar o debounce da quantidade assentar.
    await page.keyboard.press('F4');
    const dialog = page.getByRole('dialog', { name: 'Desconto na venda (F4)' });
    await dialog.getByRole('button', { name: 'Percentual (%)' }).click();
    await dialog.getByRole('textbox').fill('10');
    await dialog.getByRole('button', { name: 'Aplicar' }).click();

    // subtotal = 3 × preço unitário; desconto de 10% sobre a quantidade nova (3), não a antiga (1).
    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price * 3 * 0.9));
  });

  test('diminuir a quantidade funciona', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean, quantity: 2 }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(qtyInput(row)).toHaveValue('2');
    await decreaseQtyButton(row).click();
    await expect(qtyInput(row)).toHaveValue('1');
  });

  test('a quantidade nunca fica abaixo de um', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(qtyInput(row)).toHaveValue('1');
    await expect(decreaseQtyButton(row)).toBeDisabled();
  });

  test('digitar a quantidade diretamente no campo funciona', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await qtyInput(row).fill('7');
    await qtyInput(row).press('Enter');
    await expect(qtyInput(row)).toHaveValue('7');

    await page.reload();
    await expect(qtyInput(saleItemRow(page, PRODUCTS.skol.name))).toHaveValue('7');
  });

  test('o total exibido acompanha a quantidade alterada', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price));

    await increaseQtyButton(row).click();
    await increaseQtyButton(row).click();

    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price * 3));
  });
});
