import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { addKnownItems, ensureFreshSale, saleItemRow, scanInput } from './support/pos';
import { PRODUCTS } from './support/seed-data';

test.describe('atalhos de teclado', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await ensureFreshSale(page);
  });

  test('a tecla de busca (F2) abre a busca de produtos, com o campo de código focado', async ({
    page,
  }) => {
    await expect(scanInput(page)).toBeFocused();
    await page.keyboard.press('F2');
    await expect(page.getByRole('dialog', { name: 'Buscar produto (F2)' })).toBeVisible();
  });

  test('a tecla de desconto (F4) abre o desconto', async ({ page }) => {
    await page.keyboard.press('F4');
    await expect(page.getByRole('dialog', { name: 'Desconto na venda (F4)' })).toBeVisible();
  });

  test('as teclas de meio de pagamento selecionam dinheiro, PIX e cartão respectivamente', async ({
    page,
  }) => {
    const cash = page.getByRole('button', { name: 'Pagamento Dinheiro' });
    const pix = page.getByRole('button', { name: 'Pagamento PIX' });
    const card = page.getByRole('button', { name: 'Pagamento Cartão' });

    await page.keyboard.press('F6');
    await expect(pix).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('F7');
    await expect(card).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('F5');
    await expect(cash).toHaveAttribute('aria-pressed', 'true');
  });

  test('a tecla de cliente (F8) abre a seleção de cliente', async ({ page }) => {
    await page.keyboard.press('F8');
    await expect(page.getByRole('dialog', { name: 'Cliente do fiado (F8)' })).toBeVisible();
  });

  test('a tecla de conclusão (F10) finaliza a venda', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);

    // PIX dispensa valor recebido — espera o estado assentar antes de F10,
    // senão finalize() pode ler o `payment` de um render anterior (ainda CASH).
    await page.keyboard.press('F6');
    await expect(page.getByRole('button', { name: 'Pagamento PIX' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.keyboard.press('F10');
    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toBeVisible();
  });

  test('a tecla de remoção retira o item selecionado quando o campo de código está vazio', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(row).toBeVisible();
    await expect(scanInput(page)).toHaveValue('');

    await page.keyboard.press('Delete');
    const confirmDialog = page.getByRole('dialog', { name: 'Remover item?' });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Remover' }).click();

    await expect(row).toHaveCount(0);
  });

  test('a tecla de remoção não retira item enquanto há texto no campo de código', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await scanInput(page).fill('abc');
    await expect(scanInput(page)).toHaveValue('abc');

    await page.keyboard.press('Delete');

    await expect(page.getByRole('dialog', { name: 'Remover item?' })).toHaveCount(0);
    await expect(saleItemRow(page, PRODUCTS.skol.name)).toBeVisible();
  });

  test('escape fecha o modal aberto', async ({ page }) => {
    await page.keyboard.press('F2');
    const dialog = page.getByRole('dialog', { name: 'Buscar produto (F2)' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('escape com venda montada e sem modal aberto pede confirmação de cancelamento, sem cancelar direto', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    const row = saleItemRow(page, PRODUCTS.skol.name);
    await expect(row).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Cancelar venda em andamento?' })).toBeVisible();
    // Não cancelou direto — o item continua na venda por trás do modal.
    await expect(row).toBeVisible();
  });

  test('com um modal aberto, os atalhos da frente de caixa não disparam', async ({ page }) => {
    await page.getByRole('button', { name: 'Pagamento PIX' }).click();
    await expect(page.getByRole('button', { name: 'Pagamento PIX' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await page.keyboard.press('F4'); // abre o desconto
    const dialog = page.getByRole('dialog', { name: 'Desconto na venda (F4)' });
    await expect(dialog).toBeVisible();

    // Com o modal aberto, F5 (dinheiro) não deveria trocar o meio de pagamento.
    await page.keyboard.press('F5');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Pagamento PIX' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
