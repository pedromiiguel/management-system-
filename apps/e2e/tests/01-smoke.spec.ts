import { test } from '@playwright/test';
import { resetDatabase } from './support/db';
import { openPos } from './support/pos';

test.describe('harness', () => {
  test.beforeAll(() => {
    resetDatabase();
  });

  test('com a sessão persistida, a frente de caixa carrega com uma venda em andamento', async ({
    page,
  }) => {
    await openPos(page);
  });
});
