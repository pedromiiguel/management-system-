import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreateStockAdjustmentHandler } from './create-stock-adjustment-handler';

describe('CreateStockAdjustmentHandler', () => {
  it('registra um ajuste manual via POST /stock/adjustments', async () => {
    const result = { id: 'm1', type: 'EXIT' as const, quantity: 3 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: result }) };
    const handler = new CreateStockAdjustmentHandler(httpClient);
    const input = { productId: 'p1', quantity: -3, reason: 'quebra' };

    const response = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/stock/adjustments', method: 'POST', body: input });
    expect(response).toBe(result);
  });
});
