import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { DeactivateProductHandler } from './deactivate-product-handler';

describe('DeactivateProductHandler', () => {
  it('desativa um produto via PATCH /products/:id/deactivate', async () => {
    const product = { id: 'p1', active: false };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: product }) };
    const handler = new DeactivateProductHandler(httpClient);

    const result = await handler.deactivate('p1');

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/products/p1/deactivate', method: 'PATCH' });
    expect(result).toBe(product);
  });
});
