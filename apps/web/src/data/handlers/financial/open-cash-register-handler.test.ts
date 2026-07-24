import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { OpenCashRegisterHandler } from './open-cash-register-handler';

describe('OpenCashRegisterHandler', () => {
  it('abre o caixa via POST /cash-register/open', async () => {
    const register = { id: 'r1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: register }) };
    const handler = new OpenCashRegisterHandler(httpClient);

    const result = await handler.open({ openingBalance: 100 });

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/cash-register/open',
      method: 'POST',
      body: { openingBalance: 100 },
    });
    expect(result).toBe(register);
  });
});
