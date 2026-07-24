import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { DeleteProductHandler } from './delete-product-handler';

describe('DeleteProductHandler', () => {
  it('exclui um produto via DELETE /products/:id', async () => {
    const httpClient: IHttpClient = {
      request: vi.fn().mockResolvedValue({ statusCode: 200, body: { deleted: true } }),
    };
    const handler = new DeleteProductHandler(httpClient);

    const result = await handler.delete('p1');

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/products/p1', method: 'DELETE' });
    expect(result).toEqual({ deleted: true });
  });
});
