import { expect, type Locator, type Page } from '@playwright/test';

/** Campo de código — vive focado o tempo todo; scanner USB emula teclado + Enter. */
export function scanInput(page: Page): Locator {
  return page.getByLabel('Código de barras, SKU ou nome do produto');
}

/**
 * Dispara um atalho global (F2/F4/F5-F8/F10/Delete/Escape) via KeyboardEvent
 * sintético no document, em vez de page.keyboard.press. Teclas de função
 * despachadas no nível do SO/CDP mostraram-se ocasionalmente engolidas antes
 * de chegar à página (flakiness rara, não relacionada ao código do PDV);
 * despachar direto no document entrega de forma determinística ao listener
 * da lib de atalhos, sem depender de foco real de janela.
 */
export async function pressHotkey(page: Page, key: string): Promise<void> {
  await page.evaluate((k) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, bubbles: true, cancelable: true }));
  }, key);
}

export function totalValue(page: Page): Locator {
  return page.getByTestId('pos-total');
}

export function changeValue(page: Page): Locator {
  return page.getByTestId('pos-change');
}

export function discountValue(page: Page): Locator {
  return page.getByTestId('pos-discount-value');
}

export function serviceFeeValue(page: Page): Locator {
  return page.getByTestId('pos-service-fee-value');
}

export function selectedCustomer(page: Page): Locator {
  return page.getByTestId('pos-selected-customer');
}

/** Linha da venda pelo nome do produto — estável independente da ordem de renderização. */
export function saleItemRow(page: Page, productName: string): Locator {
  return page.locator('[data-testid^="sale-item-"]').filter({ hasText: productName });
}

/**
 * Campo de quantidade digitável de uma linha — `exact: true` porque os
 * botões +/- também têm nome acessível contendo "quantidade" ("Aumentar
 * quantidade"/"Diminuir quantidade") e casariam por substring.
 */
export function qtyInput(row: Locator): Locator {
  return row.getByLabel('Quantidade', { exact: true });
}

export function increaseQtyButton(row: Locator): Locator {
  return row.getByRole('button', { name: 'Aumentar quantidade' });
}

export function decreaseQtyButton(row: Locator): Locator {
  return row.getByRole('button', { name: 'Diminuir quantidade' });
}

export function removeItemButton(row: Locator): Locator {
  return row.getByRole('button', { name: 'Remover item' });
}

/** Abre a frente de caixa e aguarda a venda em andamento + foco no campo de código. */
export async function openPos(page: Page): Promise<void> {
  await page.goto('/pos');
  await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();
  await expect(scanInput(page)).toBeFocused();
}

/**
 * Só existe uma venda em andamento por operador — o backend a retoma a cada
 * `POST /sales`. Como o reset de banco é por arquivo (não por teste, ver ADR
 * 0001), cada teste que precisa de um carrinho vazio cancela qualquer venda
 * deixada por um teste anterior no mesmo arquivo, sempre pelo navegador.
 */
export async function ensureFreshSale(page: Page): Promise<void> {
  await openPos(page);
  const hasItems = (await page.locator('[data-testid^="sale-item-"]').count()) > 0;
  if (!hasItems) return;

  await page.getByRole('button', { name: 'Cancelar venda' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancelar venda em andamento?' });
  await dialog.getByRole('button', { name: 'Cancelar venda' }).click();

  await expect(page.getByText(/Venda #[A-Z0-9]{6} em andamento/)).toBeVisible();
  await expect(page.locator('[data-testid^="sale-item-"]')).toHaveCount(0);
  await expect(scanInput(page)).toBeFocused();
}

/** Digita um código (com atalho opcional de quantidade "N*código") e confirma com Enter. */
export async function addItemByCode(page: Page, code: string, quantity?: number): Promise<void> {
  const input = scanInput(page);
  const value = quantity ? `${quantity}*${code}` : code;
  await input.fill(value);
  await input.press('Enter');
}

/**
 * Monta uma venda com itens conhecidos do seed — forma reutilizável pelos
 * demais arquivos da suíte (04-08). Aguarda o campo limpar e recuperar foco
 * após cada item, sinal de que o servidor confirmou a inclusão.
 */
export async function addKnownItems(
  page: Page,
  items: { code: string; quantity?: number }[],
): Promise<void> {
  const input = scanInput(page);
  for (const item of items) {
    await addItemByCode(page, item.code, item.quantity);
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  }
}
