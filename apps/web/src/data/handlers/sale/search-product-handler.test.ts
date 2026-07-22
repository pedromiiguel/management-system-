import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchProductHandler } from './search-product-handler';

describe('SearchProductHandler', () => {
  it('busca produtos por nome/SKU/EAN via GET /products', async () => {
    const items = [{ id: 'p1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: { items } }) };
    const handler = new SearchProductHandler(httpClient);

    const result = await handler.search('skol', 6);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/products',
      method: 'GET',
      queryParams: { search: 'skol', perPage: 6 },
    });
    expect(result).toEqual({ items });
  });
});
