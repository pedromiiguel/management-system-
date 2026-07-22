import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreateCustomerHandler } from './create-customer-handler';

describe('CreateCustomerHandler', () => {
  it('cadastra um cliente novo via POST /customers', async () => {
    const customer = { id: 'c1', name: 'João' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: customer }) };
    const handler = new CreateCustomerHandler(httpClient);

    const result = await handler.create('João');

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/customers',
      method: 'POST',
      body: { name: 'João' },
    });
    expect(result).toBe(customer);
  });
});
