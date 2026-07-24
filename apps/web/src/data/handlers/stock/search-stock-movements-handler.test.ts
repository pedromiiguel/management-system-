import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchStockMovementsHandler } from './search-stock-movements-handler';

describe('SearchStockMovementsHandler', () => {
  it('busca as movimentações via GET /stock/movements, sem filtro', async () => {
    const movements = [{ id: 'm1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: movements }) };
    const handler = new SearchStockMovementsHandler(httpClient);

    const result = await handler.search();

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/stock/movements',
      method: 'GET',
      queryParams: { productId: undefined },
    });
    expect(result).toBe(movements);
  });

  it('filtra por productId quando informado', async () => {
    const movements: unknown[] = [];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: movements }) };
    const handler = new SearchStockMovementsHandler(httpClient);

    await handler.search('p1');

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/stock/movements',
      method: 'GET',
      queryParams: { productId: 'p1' },
    });
  });
});
