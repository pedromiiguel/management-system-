import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { SearchCashRegisterHistoryHandler } from './search-cash-register-history-handler';

describe('SearchCashRegisterHistoryHandler', () => {
  it('busca o histórico de fechamentos via GET /cash-register/history', async () => {
    const history = [{ id: 'r1' }];
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: history }) };
    const handler = new SearchCashRegisterHistoryHandler(httpClient);

    const result = await handler.search();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/cash-register/history', method: 'GET' });
    expect(result).toBe(history);
  });
});
