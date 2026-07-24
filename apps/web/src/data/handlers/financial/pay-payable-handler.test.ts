import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { PayPayableHandler } from './pay-payable-handler';

describe('PayPayableHandler', () => {
  it('paga uma conta via POST /payables/:id/pay', async () => {
    const payable = { id: 'p1', status: 'PAID' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: payable }) };
    const handler = new PayPayableHandler(httpClient);

    const result = await handler.pay('p1');

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/payables/p1/pay', method: 'POST' });
    expect(result).toBe(payable);
  });
});
