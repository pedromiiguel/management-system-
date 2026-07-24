import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { GetStockAlertsHandler } from './get-stock-alerts-handler';

describe('GetStockAlertsHandler', () => {
  it('busca os alertas via GET /stock/alerts', async () => {
    const alerts = { lowStock: [], expiring: [] };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: alerts }) };
    const handler = new GetStockAlertsHandler(httpClient);

    const result = await handler.get();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/stock/alerts', method: 'GET' });
    expect(result).toBe(alerts);
  });
});
