import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { brl } from './support/format';
import {
  addKnownItems,
  discountValue,
  ensureFreshSale,
  pressHotkey,
  removeItemButton,
  saleItemRow,
  scanInput,
  totalValue,
} from './support/pos';
import { PRODUCTS } from './support/seed-data';

test.describe('itens, desconto e cancelamento', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await ensureFreshSale(page);
  });

  test('remover um item pede confirmação antes de executar', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await removeItemButton(row).click();

    await expect(page.getByRole('dialog', { name: 'Remover item?' })).toBeVisible();
    await expect(row).toBeVisible();
  });

  test('desistir da confirmação mantém o item na venda', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await removeItemButton(row).click();

    const dialog = page.getByRole('dialog', { name: 'Remover item?' });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialog).toBeHidden();
    await expect(row).toBeVisible();
  });

  test('confirmar a remoção retira o item e atualiza o total', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }, { code: PRODUCTS.brahma.ean }]);
    const skolRow = saleItemRow(page, PRODUCTS.skol.name);
    const brahmaRow = saleItemRow(page, PRODUCTS.brahma.name);

    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price + PRODUCTS.brahma.price));

    await removeItemButton(skolRow).click();
    const dialog = page.getByRole('dialog', { name: 'Remover item?' });
    await dialog.getByRole('button', { name: 'Remover' }).click();

    await expect(skolRow).toHaveCount(0);
    await expect(brahmaRow).toBeVisible();
    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.brahma.price));
  });

  test('após remover um item, o foco volta ao campo de código', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await removeItemButton(row).click();
    await page.getByRole('dialog', { name: 'Remover item?' }).getByRole('button', { name: 'Remover' }).click();

    await expect(scanInput(page)).toBeFocused();
  });

  test('desconto em valor é aplicado à venda e o total é recalculado', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean, quantity: 2 }]);

    await pressHotkey(page, 'F4');
    const dialog = page.getByRole('dialog', { name: 'Desconto na venda (F4)' });
    await dialog.getByRole('textbox').fill('1,00');
    await dialog.getByRole('button', { name: 'Aplicar' }).click();

    await expect(dialog).toBeHidden();
    const expectedSubtotal = PRODUCTS.skol.price * 2;
    await expect(totalValue(page)).toHaveText(brl(expectedSubtotal - 1));
    await expect(discountValue(page)).toHaveText(brl(1));
  });

  test('desconto em percentual é aplicado à venda e o total é recalculado', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean, quantity: 2 }]);

    await pressHotkey(page, 'F4');
    const dialog = page.getByRole('dialog', { name: 'Desconto na venda (F4)' });
    await dialog.getByRole('button', { name: 'Percentual (%)' }).click();
    await dialog.getByRole('textbox').fill('20');
    await dialog.getByRole('button', { name: 'Aplicar' }).click();

    await expect(dialog).toBeHidden();
    const expectedSubtotal = PRODUCTS.skol.price * 2;
    await expect(totalValue(page)).toHaveText(brl(expectedSubtotal * 0.8));
    await expect(discountValue(page)).toHaveText('20%');
  });

  test('cancelar a venda com itens pede confirmação', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Cancelar venda' }).click();
    await expect(page.getByRole('dialog', { name: 'Cancelar venda em andamento?' })).toBeVisible();
    await expect(saleItemRow(page, PRODUCTS.skol.name)).toBeVisible();
  });

  test('confirmar o cancelamento devolve uma venda nova e vazia, pronta para o próximo cliente', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const saleBadge = page.getByText(/Venda #[A-Z0-9]{6} em andamento/);
    const previousSaleId = await saleBadge.textContent();

    await page.getByRole('button', { name: 'Cancelar venda' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancelar venda em andamento?' });
    await dialog.getByRole('button', { name: 'Cancelar venda' }).click();

    await expect(dialog).toBeHidden();
    await expect(saleBadge).toBeVisible();
    await expect(saleBadge).not.toHaveText(previousSaleId ?? '');
    await expect(page.locator('[data-testid^="sale-item-"]')).toHaveCount(0);
    await expect(scanInput(page)).toBeFocused();
  });
});
