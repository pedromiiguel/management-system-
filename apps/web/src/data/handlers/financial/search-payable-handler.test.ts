import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchPayableHandler } from './search-payable-handler';

describe('SearchPayableHandler', () => {
  it('busca as contas a pagar em aberto via GET /payables', async () => {
    const payables = [{ id: 'p1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: payables }) };
    const handler = new SearchPayableHandler(httpClient);

    const result = await handler.search();

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/payables',
      method: 'GET',
      queryParams: { status: undefined },
    });
    expect(result).toBe(payables);
  });
});
