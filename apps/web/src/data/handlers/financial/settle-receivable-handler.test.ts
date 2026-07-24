import { describe, expect, it, vi } from 'vitest';
import { PaymentMethod } from '@beverage/shared';
import type { IHttpClient } from '@/@contracts/http';
import { SettleReceivableHandler } from './settle-receivable-handler';

describe('SettleReceivableHandler', () => {
  it('liquida o fiado via POST /receivables/:id/settle', async () => {
    const receivable = { id: 'rec1', status: 'RECEIVED' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: receivable }) };
    const handler = new SettleReceivableHandler(httpClient);

    const result = await handler.settle('rec1', { paymentMethod: PaymentMethod.PIX });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/receivables/rec1/settle',
      method: 'POST',
      body: { paymentMethod: PaymentMethod.PIX },
    });
    expect(result).toBe(receivable);
  });
});
