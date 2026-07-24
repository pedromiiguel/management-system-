import { describe, expect, it, vi } from 'vitest';
import { CashMovementType } from '@beverage/shared';
import type { IHttpClient } from '@/@contracts/http';
import { CreateCashMovementHandler } from './create-cash-movement-handler';

describe('CreateCashMovementHandler', () => {
  it('registra sangria/suprimento via POST /cash-register/movements', async () => {
    const movement = { id: 'm1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: movement }) };
    const handler = new CreateCashMovementHandler(httpClient);
    const input = { type: CashMovementType.FLOAT, amount: 50, description: 'Suprimento' };

    const result = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({
      url: '/cash-register/movements',
      method: 'POST',
      body: input,
    });
    expect(result).toBe(movement);
  });
});
