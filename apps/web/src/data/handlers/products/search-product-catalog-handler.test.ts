import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchProductCatalogHandler } from './search-product-catalog-handler';

describe('SearchProductCatalogHandler', () => {
  it('busca a listagem paginada via GET /products', async () => {
    const paginated = { items: [{ id: 'p1' }], total: 1, page: 1, perPage: 50 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: paginated }) };
    const handler = new SearchProductCatalogHandler(httpClient);

    const result = await handler.search({ search: 'skol', page: 1, perPage: 50, activeOnly: false });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/products',
      method: 'GET',
      queryParams: { search: 'skol', page: 1, perPage: 50, all: 'true' },
    });
    expect(result).toBe(paginated);
  });

  it('omite "all" quando activeOnly não é false (traz só ativos)', async () => {
    const paginated = { items: [], total: 0, page: 1, perPage: 6 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: paginated }) };
    const handler = new SearchProductCatalogHandler(httpClient);

    await handler.search({ search: 'x', perPage: 6 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/products',
      method: 'GET',
      queryParams: { search: 'x', page: undefined, perPage: 6, all: undefined },
    });
  });
});
