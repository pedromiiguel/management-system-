import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { UpdateProductHandler } from './update-product-handler';

describe('UpdateProductHandler', () => {
  it('edita um produto via PATCH /products/:id', async () => {
    const product = { id: 'p1', salePrice: 3.99 };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 200, body: product }) };
    const handler = new UpdateProductHandler(httpClient);
    const input = { salePrice: 3.99 };

    const result = await handler.update('p1', input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/products/p1', method: 'PATCH', body: input });
    expect(result).toBe(product);
  });
});
