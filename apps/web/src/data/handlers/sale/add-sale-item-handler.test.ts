import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { AddSaleItemHandler } from './add-sale-item-handler';

describe('AddSaleItemHandler', () => {
  it('adiciona item por código via POST /sales/:id/items', async () => {
    const response = { sale: { id: 's1' }, warning: null };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: response }) };
    const handler = new AddSaleItemHandler(httpClient);

    const result = await handler.add('s1', { code: '789', quantity: 1 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/sales/s1/items',
      method: 'POST',
      body: { code: '789', quantity: 1 },
    });
    expect(result).toBe(response);
  });
});
