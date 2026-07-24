import type { IHttpClient } from '@/@contracts/http';
import type { Product, ProductInput } from '@/domain/models/products';
import type { ICreateProduct } from '@/domain/usecases/products/create-product';
import { productsEndpoints } from '@/infra/endpoints/products';

export class CreateProductHandler implements ICreateProduct {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: ProductInput): Promise<Product> {
    const response = await this.httpClient.request<ProductInput, Product>({
      url: productsEndpoints.products(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
