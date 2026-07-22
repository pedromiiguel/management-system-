import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchCustomerHandler } from './search-customer-handler';

describe('SearchCustomerHandler', () => {
  it('busca clientes por nome via GET /customers', async () => {
    const customers = [{ id: 'c1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: customers }) };
    const handler = new SearchCustomerHandler(httpClient);

    const result = await handler.search('joão');

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/customers',
      method: 'GET',
      queryParams: { search: 'joão' },
    });
    expect(result).toBe(customers);
  });
});
