import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreatePayableHandler } from './create-payable-handler';

describe('CreatePayableHandler', () => {
  it('cria uma conta a pagar via POST /payables', async () => {
    const payable = { id: 'p1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: payable }) };
    const handler = new CreatePayableHandler(httpClient);
    const input = { description: 'Fornecedor', amount: 80, dueDate: new Date('2026-08-01') };

    const result = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/payables', method: 'POST', body: input });
    expect(result).toBe(payable);
  });
});
