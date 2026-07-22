import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CancelSaleHandler } from './cancel-sale-handler';

describe('CancelSaleHandler', () => {
  it('cancela a venda em andamento via POST /sales/:id/cancel', async () => {
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: {} }) };
    const handler = new CancelSaleHandler(httpClient);

    await handler.cancel('s1');

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/sales/s1/cancel', method: 'POST' });
  });
});
