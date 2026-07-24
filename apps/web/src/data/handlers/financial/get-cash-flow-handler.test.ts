import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { GetCashFlowHandler } from './get-cash-flow-handler';

describe('GetCashFlowHandler', () => {
  it('busca o fluxo de caixa do período via GET /financial/cash-flow', async () => {
    const flow = { movements: [], inflows: 0, outflows: 0, balance: 0 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: flow }) };
    const handler = new GetCashFlowHandler(httpClient);

    const result = await handler.get('2026-07-01', '2026-07-31T23:59:59');

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/financial/cash-flow',
      method: 'GET',
      queryParams: { from: '2026-07-01', to: '2026-07-31T23:59:59' },
    });
    expect(result).toBe(flow);
  });
});
