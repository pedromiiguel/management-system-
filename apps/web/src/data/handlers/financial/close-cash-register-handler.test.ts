import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CloseCashRegisterHandler } from './close-cash-register-handler';

describe('CloseCashRegisterHandler', () => {
  it('fecha o caixa via POST /cash-register/close', async () => {
    const closed = { id: 'r1', difference: 5 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: closed }) };
    const handler = new CloseCashRegisterHandler(httpClient);

    const result = await handler.close({ countedBalance: 125 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/cash-register/close',
      method: 'POST',
      body: { countedBalance: 125 },
    });
    expect(result).toBe(closed);
  });
});
