import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { openProductsPage } from './support/products';
import { PRODUCTS } from './support/seed-data';

// Suíte E2E de products — trava a integração UI ↔ API de products.tsx ANTES
// da refatoração estrutural (ADR 0007), mesmo espírito das suítes do PDV e do
// financeiro. Regra de negócio com ramificação (BR-04, permissão dupla) já
// está coberta por apps/api/test/products.e2e-spec.ts (supertest) — aqui só
// se verifica o caminho feliz da UI (ver Decisão 4 da ADR 0007).

test.describe('Produtos — Listagem, busca e filtros', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openProductsPage(page));

  test('lista os produtos do seed com o total correto', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Todos · 11' })).toBeVisible();
    await expect(page.getByText(PRODUCTS.skol.name)).toBeVisible();
  });

  test('busca por nome filtra a listagem', async ({ page }) => {
    await page.getByPlaceholder('Buscar por nome, SKU ou código de barras…').fill('Skol');
    await expect(page.getByText(PRODUCTS.skol.name)).toBeVisible();
    await expect(page.getByText(PRODUCTS.brahma.name)).toBeHidden();
  });

  test('filtro "Estoque baixo" mostra o produto sem estoque do seed', async ({ page }) => {
    await page.getByRole('button', { name: /Estoque baixo/ }).click();
    await expect(page.getByText(PRODUCTS.zeroStock.name)).toBeVisible();
    await expect(page.getByText(PRODUCTS.skol.name)).toBeHidden();
  });
});

test.describe('Produtos — Cadastro', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openProductsPage(page));

  test('cria produto sem entrada de estoque', async ({ page }) => {
    await page.getByRole('button', { name: '+ Novo produto' }).click();
    const dialog = page.getByRole('dialog', { name: 'Novo produto' });
    await dialog.getByTestId('product-name').fill('Produto E2E Sem Entrada');
    await dialog.getByTestId('product-sku').fill('E2E-SEM-ENTRADA');
    await dialog.getByTestId('product-purchase-price').fill('1');
    await dialog.getByTestId('product-sale-price').fill('2');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByText('Produto E2E Sem Entrada')).toBeVisible();
  });

  test('cria produto com entrada de estoque embutida e o estoque inicial aparece na listagem', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '+ Novo produto' }).click();
    const dialog = page.getByRole('dialog', { name: 'Novo produto' });
    await dialog.getByTestId('product-name').fill('Produto E2E Com Entrada');
    await dialog.getByTestId('product-sku').fill('E2E-COM-ENTRADA');
    await dialog.getByTestId('product-purchase-price').fill('1');
    await dialog.getByTestId('product-sale-price').fill('2');
    await dialog.getByTestId('product-stock-entry-quantity').fill('10');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: 'Produto E2E Com Entrada' });
    await expect(row).toContainText('10');
  });

  test('edita um produto existente', async ({ page }) => {
    await page.getByText(PRODUCTS.skol.name).click();
    const dialog = page.getByRole('dialog', { name: `Editar — ${PRODUCTS.skol.name}` });
    await dialog.getByTestId('product-sale-price').fill('3.99');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.skol.name });
    await expect(row).toContainText('3,99');
  });

  test('desativa um produto', async ({ page }) => {
    await page.getByText(PRODUCTS.brahma.name).click();
    const dialog = page.getByRole('dialog', { name: `Editar — ${PRODUCTS.brahma.name}` });
    await dialog.getByRole('button', { name: 'Desativar' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.brahma.name });
    await expect(row.getByText('inativo')).toBeVisible();
  });
});

test.describe('Produtos — Exclusão', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openProductsPage(page));

  test('exclui um produto sem venda registrada', async ({ page }) => {
    const productName = 'Suco Del Valle Uva 1L';
    const row = page.locator('.s-tr').filter({ hasText: productName });
    await row.getByRole('button', { name: 'Excluir produto' }).click();

    const confirm = page.getByRole('dialog', { name: 'Excluir produto?' });
    await confirm.getByRole('button', { name: 'Excluir' }).click();
    await expect(confirm).toBeHidden();

    await expect(page.getByText(productName)).toBeHidden();
  });
});

test.describe('Produtos — Entrada de estoque avulsa', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openProductsPage(page));

  test('registra entrada avulsa via StockEntryModal e soma ao estoque existente', async ({ page }) => {
    await page.getByRole('button', { name: 'Entrada de estoque' }).click();
    const dialog = page.getByRole('dialog', { name: 'Entrada de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(PRODUCTS.cocaCola.name);
    await dialog.getByText(PRODUCTS.cocaCola.name).click();
    await dialog.getByTestId('entry-quantity').fill('5');
    await dialog.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: PRODUCTS.cocaCola.name });
    // 60 (seed) + 5 (entrada avulsa) = 65.
    await expect(row).toContainText('65');
  });

  test('entrada avulsa com validade próxima aparece no filtro "Vencimento próximo"', async ({ page }) => {
    const heinekenName = PRODUCTS.heineken.name;
    await page.getByRole('button', { name: 'Entrada de estoque' }).click();
    const dialog = page.getByRole('dialog', { name: 'Entrada de estoque' });
    await dialog.getByPlaceholder('Buscar produto…').fill(heinekenName);
    await dialog.getByText(heinekenName).click();
    await dialog.getByTestId('entry-quantity').fill('3');

    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const isoDate = soon.toISOString().slice(0, 10);
    await dialog.getByTestId('entry-expires-at').fill(isoDate);

    await dialog.getByRole('button', { name: 'Registrar entrada' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: /Vencimento próximo/ }).click();
    await expect(page.getByText(heinekenName)).toBeVisible();
  });
});
