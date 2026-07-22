import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { OpenSaleHandler } from './open-sale-handler';

describe('OpenSaleHandler', () => {
  it('abre (ou retoma) a venda em andamento via POST /sales', async () => {
    const sale = { id: 's1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: sale }) };
    const handler = new OpenSaleHandler(httpClient);

    const result = await handler.open();

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/sales', method: 'POST' });
    expect(result).toBe(sale);
  });
});
