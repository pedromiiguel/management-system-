import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SetSaleDiscountHandler } from './set-sale-discount-handler';

describe('SetSaleDiscountHandler', () => {
  it('aplica desconto via PUT /sales/:id/discount', async () => {
    const sale = { id: 's1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: sale }) };
    const handler = new SetSaleDiscountHandler(httpClient);

    const result = await handler.set('s1', { type: 'PERCENT', value: 10 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/sales/s1/discount',
      method: 'PUT',
      body: { type: 'PERCENT', value: 10 },
    });
    expect(result).toBe(sale);
  });

  it('remove desconto enviando null', async () => {
    const sale = { id: 's1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: sale }) };
    const handler = new SetSaleDiscountHandler(httpClient);

    await handler.set('s1', null);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/sales/s1/discount',
      method: 'PUT',
      body: null,
    });
  });
});
