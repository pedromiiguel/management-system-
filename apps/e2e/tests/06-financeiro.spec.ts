import { expect, test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { openFinancialTab } from './support/financial';
import { CUSTOMER_NAME } from './support/seed-data';

// formatBRL usa espaço fino (U+00A0) entre "R$" e o valor — ver
// support/format.ts#brl. Escrito explícito para não depender de um espaço
// invisível copiado no meio da string.
const brl = (value: string) => `R$ ${value}`;

// Suíte E2E do financeiro — trava o comportamento observável das 5 abas
// ANTES da refatoração estrutural (ADR 0001/0006), mesmo espírito da suíte
// do PDV. Regra de negócio (diferença de caixa, liquidação de fiado) já está
// coberta por apps/api/test/financial.e2e-spec.ts (supertest) — aqui só se
// verifica a integração UI ↔ API.

test.describe('Financeiro — Caixa (BR-06)', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openFinancialTab(page, 'Caixa'));

  test('mostra o caixa aberto pelo seed, com saldo inicial de R$ 100,00', async ({ page }) => {
    await expect(page.getByText('aberto', { exact: true })).toBeVisible();
    const openingRow = page.locator('.s-kv').filter({ hasText: 'Saldo inicial' });
    await expect(openingRow.getByText(brl('100,00'), { exact: true })).toBeVisible();
  });

  test('sangria e suprimento atualizam o dinheiro esperado na gaveta', async ({ page }) => {
    await page.getByRole('button', { name: 'Sangria / Suprimento' }).click();
    let dialog = page.getByRole('dialog', { name: 'Movimento de caixa' });
    await dialog.getByRole('button', { name: 'Suprimento' }).click();
    await dialog.getByTestId('cash-move-amount').fill('50');
    await dialog.getByTestId('cash-move-description').fill('Suprimento e2e');
    await dialog.getByRole('button', { name: 'Registrar' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Sangria / Suprimento' }).click();
    dialog = page.getByRole('dialog', { name: 'Movimento de caixa' });
    await dialog.getByRole('button', { name: 'Sangria' }).click();
    await dialog.getByTestId('cash-move-amount').fill('30');
    await dialog.getByTestId('cash-move-description').fill('Sangria e2e');
    await dialog.getByRole('button', { name: 'Registrar' }).click();
    await expect(dialog).toBeHidden();

    // 100 (abertura) + 50 (suprimento) − 30 (sangria) = 120
    const expectedRow = page.locator('.s-kv').filter({ hasText: 'Dinheiro esperado na gaveta' });
    await expect(expectedRow.getByText(brl('120,00'), { exact: true })).toBeVisible();
  });

  test('fecha o caixa e mostra a diferença calculada contra o esperado', async ({ page }) => {
    await page.getByRole('button', { name: 'Fechar caixa' }).click();
    const dialog = page.getByRole('dialog', { name: 'Fechar caixa (conferência — BR-06)' });
    await dialog.getByPlaceholder('0,00').fill('125');
    await expect(dialog.getByText(brl('5,00'), { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Fechar caixa' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByRole('button', { name: 'Abrir caixa' })).toBeVisible();
    await expect(page.getByText('Fechamentos anteriores')).toBeVisible();
  });
});

test.describe('Financeiro — Fiado (a receber)', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openFinancialTab(page, 'Fiado (a receber)'));

  test('lista o fiado em aberto garantido pelo seed', async ({ page }) => {
    await expect(page.getByText(CUSTOMER_NAME)).toBeVisible();
    await expect(page.getByText(brl('42,00'), { exact: true })).toBeVisible();
  });

  test('liquidar via PIX remove o fiado da lista de abertos', async ({ page }) => {
    await page.getByRole('button', { name: 'Receber', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `Receber de ${CUSTOMER_NAME}` });
    await dialog.getByRole('button', { name: 'PIX' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Nenhum fiado em aberto')).toBeVisible();
  });
});

test.describe('Financeiro — Contas a pagar', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openFinancialTab(page, 'Contas a pagar'));

  test('cria uma conta a pagar e ela aparece na lista de abertas', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nova conta' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nova conta a pagar' });
    await dialog.getByTestId('payable-description').fill('Fornecedor e2e');
    await dialog.getByTestId('payable-amount').fill('80');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByText('Fornecedor e2e')).toBeVisible();
  });

  test('pagar a conta a remove da lista de contas em aberto', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nova conta' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nova conta a pagar' });
    await dialog.getByTestId('payable-description').fill('Fornecedor a pagar e2e');
    await dialog.getByTestId('payable-amount').fill('45');
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog).toBeHidden();

    const row = page.locator('.s-tr').filter({ hasText: 'Fornecedor a pagar e2e' });
    await row.getByRole('button', { name: 'Pagar' }).click();
    await expect(page.getByText('Fornecedor a pagar e2e')).toHaveCount(0);
  });
});

test.describe('Financeiro — Fluxo & lançamentos', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openFinancialTab(page, 'Fluxo & lançamentos'));

  test('lançamento avulso aparece na tabela do período', async ({ page }) => {
    await page.getByRole('button', { name: '+ Lançamento avulso' }).click();
    const dialog = page.getByRole('dialog', { name: 'Lançamento avulso (FR-35)' });
    await dialog.getByTestId('manual-entry-amount').fill('15');
    await dialog.getByTestId('manual-entry-description').fill('Lançamento e2e');
    await dialog.getByRole('button', { name: 'Registrar' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByText('Lançamento e2e')).toBeVisible();
  });
});

test.describe('Financeiro — Visão geral', () => {
  test.beforeAll(() => resetDatabase());
  test.beforeEach(async ({ page }) => openFinancialTab(page, 'Visão geral'));

  test('mostra os indicadores principais sem nenhuma venda no período (seed)', async ({ page }) => {
    await expect(page.getByText('Faturamento (mês)')).toBeVisible();
    await expect(page.getByText('Resultado (mês)')).toBeVisible();
    await expect(page.getByText('Meta de faturamento')).toBeVisible();
  });
});
