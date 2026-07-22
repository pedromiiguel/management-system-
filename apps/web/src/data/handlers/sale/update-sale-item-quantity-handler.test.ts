import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { UpdateSaleItemQuantityHandler } from './update-sale-item-quantity-handler';

describe('UpdateSaleItemQuantityHandler', () => {
  it('atualiza a quantidade de um item via PATCH /sales/:id/items/:itemId', async () => {
    const response = { sale: { id: 's1' }, warning: null };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: response }) };
    const handler = new UpdateSaleItemQuantityHandler(httpClient);

    const result = await handler.update('s1', 'i1', { quantity: 4 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/sales/s1/items/i1',
      method: 'PATCH',
      body: { quantity: 4 },
    });
    expect(result).toBe(response);
  });
});
