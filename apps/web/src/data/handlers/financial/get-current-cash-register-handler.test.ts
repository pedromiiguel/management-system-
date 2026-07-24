import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { GetCurrentCashRegisterHandler } from './get-current-cash-register-handler';

describe('GetCurrentCashRegisterHandler', () => {
  it('busca o caixa aberto via GET /cash-register/current', async () => {
    const register = { id: 'r1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: register }) };
    const handler = new GetCurrentCashRegisterHandler(httpClient);

    const result = await handler.get();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/cash-register/current', method: 'GET' });
    expect(result).toBe(register);
  });
});
