import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchReceivableHandler } from './search-receivable-handler';

describe('SearchReceivableHandler', () => {
  it('busca o fiado em aberto via GET /receivables', async () => {
    const receivables = [{ id: 'r1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: receivables }) };
    const handler = new SearchReceivableHandler(httpClient);

    const result = await handler.search();

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/receivables',
      method: 'GET',
      queryParams: { customerId: undefined, status: undefined },
    });
    expect(result).toBe(receivables);
  });
});
