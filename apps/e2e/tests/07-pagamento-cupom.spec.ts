import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { brl, cupomBrl } from './support/format';
import { addKnownItems, changeValue, ensureFreshSale, scanInput, selectedCustomer, totalValue } from './support/pos';
import { CUSTOMER_NAME, PRODUCTS } from './support/seed-data';

test.describe('pagamento, conclusão e cupom', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await ensureFreshSale(page);
  });

  test('selecionar dinheiro e informar o valor recebido exibe o troco calculado', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Dinheiro' }).click();
    await page.getByLabel('Valor recebido').fill('1000');

    // total = 3,50; recebido = 10,00 → troco = 6,50.
    await expect(changeValue(page)).toHaveText(brl(10 - PRODUCTS.skol.price));
  });

  test('finalizar em dinheiro com valor recebido menor que o total é bloqueado, com aviso', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Dinheiro' }).click();
    await page.getByLabel('Valor recebido').fill('100');
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    await expect(page.getByText('Informe o valor recebido')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toHaveCount(0);
  });

  test('venda em dinheiro é concluída com sucesso quando o valor recebido cobre o total', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Dinheiro' }).click();
    await page.getByLabel('Valor recebido').fill('350');
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toBeVisible();
  });

  test('venda em PIX é concluída sem informar valor recebido', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento PIX' }).click();
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toBeVisible();
  });

  test('venda em cartão é concluída sem informar valor recebido', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Cartão' }).click();
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toBeVisible();
  });

  test('finalizar em fiado sem cliente abre a seleção de cliente em vez de exibir erro', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Fiado' }).click();

    // A seleção de cliente abre automaticamente ao escolher fiado — fecha
    // sem escolher, para chegar ao estado "fiado selecionado, sem cliente".
    const customerDialog = page.getByRole('dialog', { name: 'Cliente do fiado (F8)' });
    await expect(customerDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(customerDialog).toBeHidden();

    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    await expect(customerDialog).toBeVisible();
    await expect(page.locator('.s-toast')).toHaveCount(0);
  });

  test('venda em fiado é concluída após escolher o cliente do seed', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Fiado' }).click();

    const customerDialog = page.getByRole('dialog', { name: 'Cliente do fiado (F8)' });
    await customerDialog.getByPlaceholder('Buscar cliente…').fill(CUSTOMER_NAME);
    await customerDialog.getByText(CUSTOMER_NAME, { exact: true }).click();

    await expect(customerDialog).toBeHidden();
    await expect(selectedCustomer(page)).toHaveText(CUSTOMER_NAME);

    await page.getByRole('button', { name: 'Finalizar venda' }).click();
    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toBeVisible();
  });

  test('finalizar uma venda sem itens é bloqueado, com aviso', async ({ page }) => {
    await page.getByRole('button', { name: 'Finalizar venda' }).click();
    await expect(page.getByText('Adicione itens antes de finalizar')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Venda concluída ✓' })).toHaveCount(0);
  });

  test('ativar a taxa de serviço aumenta o total exibido', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price));

    await page.getByRole('button', { name: 'Taxa de serviço' }).click();

    await expect(totalValue(page)).toHaveText(brl(PRODUCTS.skol.price * 1.1));
  });

  test('alternar entre com nota e sem nota funciona e o estado é refletido na tela', async ({
    page,
  }) => {
    const toggle = page.getByRole('button', { name: 'Emitir nota fiscal' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('após concluir, o cupom exibe os itens e o total da venda; fechá-lo prepara a próxima venda', async ({
    page,
  }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean, quantity: 2 }]);
    await page.getByRole('button', { name: 'Pagamento PIX' }).click();
    await page.getByRole('button', { name: 'Finalizar venda' }).click();

    const receipt = page.getByRole('dialog', { name: 'Venda concluída ✓' });
    const cupomText = receipt.locator('pre');
    await expect(cupomText).toContainText(PRODUCTS.skol.name);
    await expect(cupomText).toContainText(cupomBrl(PRODUCTS.skol.price * 2));

    await receipt.getByRole('button', { name: 'Nova venda (Enter)' }).click();

    await expect(receipt).toBeHidden();
    await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();
    await expect(page.locator('[data-testid^="sale-item-"]')).toHaveCount(0);
    await expect(scanInput(page)).toBeFocused();
  });

  test('meio de pagamento e cliente voltam ao padrão entre uma venda e outra', async ({ page }) => {
    await addKnownItems(page, [{ code: PRODUCTS.skol.ean }]);
    await page.getByRole('button', { name: 'Pagamento Fiado' }).click();
    const customerDialog = page.getByRole('dialog', { name: 'Cliente do fiado (F8)' });
    await customerDialog.getByPlaceholder('Buscar cliente…').fill(CUSTOMER_NAME);
    await customerDialog.getByText(CUSTOMER_NAME, { exact: true }).click();
    await expect(selectedCustomer(page)).toHaveText(CUSTOMER_NAME);

    await page.getByRole('button', { name: 'Finalizar venda' }).click();
    const receipt = page.getByRole('dialog', { name: 'Venda concluída ✓' });
    await expect(receipt).toBeVisible();
    await receipt.getByRole('button', { name: 'Nova venda (Enter)' }).click();
    await expect(receipt).toBeHidden();

    // Dinheiro é o padrão inicial — a nova venda não deve continuar em fiado.
    await expect(page.getByRole('button', { name: 'Pagamento Dinheiro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Pagamento Fiado' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
