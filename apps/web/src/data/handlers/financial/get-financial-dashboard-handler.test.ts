import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { GetFinancialDashboardHandler } from './get-financial-dashboard-handler';

describe('GetFinancialDashboardHandler', () => {
  it('busca o dashboard via GET /financial/dashboard', async () => {
    const dashboard = { revenue: { day: 0, month: 0, year: 0 } };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: dashboard }) };
    const handler = new GetFinancialDashboardHandler(httpClient);

    const result = await handler.get();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/financial/dashboard', method: 'GET' });
    expect(result).toBe(dashboard);
  });
});
