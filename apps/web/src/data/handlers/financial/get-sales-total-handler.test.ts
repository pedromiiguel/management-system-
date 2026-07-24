import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { GetSalesTotalHandler } from './get-sales-total-handler';

describe('GetSalesTotalHandler', () => {
  it('busca o total de vendas do período via GET /reports/sales', async () => {
    const total = { total: 150 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: total }) };
    const handler = new GetSalesTotalHandler(httpClient);

    const result = await handler.get('2026-07-01', '2026-07-31');

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/reports/sales',
      method: 'GET',
      queryParams: { from: '2026-07-01', to: '2026-07-31' },
    });
    expect(result).toBe(total);
  });
});
