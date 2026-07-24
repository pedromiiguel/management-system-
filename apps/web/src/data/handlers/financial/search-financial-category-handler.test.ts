import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchFinancialCategoryHandler } from './search-financial-category-handler';

describe('SearchFinancialCategoryHandler', () => {
  it('busca as categorias financeiras via GET /financial/categories', async () => {
    const categories = [{ id: 'c1', name: 'Vendas', kind: 'INCOME', system: true }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: categories }) };
    const handler = new SearchFinancialCategoryHandler(httpClient);

    const result = await handler.search();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/financial/categories', method: 'GET' });
    expect(result).toBe(categories);
  });
});
