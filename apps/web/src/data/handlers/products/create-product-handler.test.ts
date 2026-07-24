import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreateProductHandler } from './create-product-handler';

describe('CreateProductHandler', () => {
  it('cria um produto via POST /products', async () => {
    const product = { id: 'p1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: product }) };
    const handler = new CreateProductHandler(httpClient);
    const input = { name: 'Skol', sku: 'CRV-SKL', unit: 'un', purchasePrice: 2, salePrice: 3.5, minimumStock: 0, active: true };

    const result = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/products', method: 'POST', body: input });
    expect(result).toBe(product);
  });
});
