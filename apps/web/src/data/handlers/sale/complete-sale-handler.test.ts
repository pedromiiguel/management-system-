import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CompleteSaleHandler } from './complete-sale-handler';

describe('CompleteSaleHandler', () => {
  it('conclui a venda via POST /sales/:id/complete', async () => {
    const sale = { id: 's1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: sale }) };
    const handler = new CompleteSaleHandler(httpClient);
    const input = { paymentMethod: 'CASH', withInvoice: true, serviceFee: false, amountPaid: 50 } as const;

    const result = await handler.complete('s1', input as never);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/sales/s1/complete',
      method: 'POST',
      body: input,
    });
    expect(result).toBe(sale);
  });
});
