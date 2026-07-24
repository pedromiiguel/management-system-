import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreateStockEntryHandler } from './create-stock-entry-handler';

describe('CreateStockEntryHandler', () => {
  it('registra uma entrada avulsa via POST /stock/entries', async () => {
    const result = { currentStock: 65 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: result }) };
    const handler = new CreateStockEntryHandler(httpClient);
    const input = { productId: 'p1', quantity: 5 };

    const response = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/stock/entries', method: 'POST', body: input });
    expect(response).toBe(result);
  });
});
