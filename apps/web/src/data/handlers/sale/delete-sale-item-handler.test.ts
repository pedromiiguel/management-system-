import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { DeleteSaleItemHandler } from './delete-sale-item-handler';

describe('DeleteSaleItemHandler', () => {
  it('remove um item da venda via DELETE /sales/:id/items/:itemId', async () => {
    const sale = { id: 's1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: sale }) };
    const handler = new DeleteSaleItemHandler(httpClient);

    const result = await handler.delete('s1', 'i1');

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/sales/s1/items/i1', method: 'DELETE' });
    expect(result).toBe(sale);
  });
});
