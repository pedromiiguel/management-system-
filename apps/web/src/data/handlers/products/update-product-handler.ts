import type { IHttpClient } from '@/@contracts/http';
import type { Product, UpdateProductInput } from '@/domain/models/products';
import type { IUpdateProduct } from '@/domain/usecases/products/update-product';
import { productsEndpoints } from '@/infra/endpoints/products';

export class UpdateProductHandler implements IUpdateProduct {
  constructor(private readonly httpClient: IHttpClient) {}

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const response = await this.httpClient.request<UpdateProductInput, Product>({
      url: productsEndpoints.product(id),
      method: 'PATCH',
      body: input,
    });
    return response.body;
  }
}
