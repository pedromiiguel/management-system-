import type { IHttpClient } from '@/@contracts/http';
import type { Product } from '@/domain/models/products';
import type { IDeactivateProduct } from '@/domain/usecases/products/deactivate-product';
import { productsEndpoints } from '@/infra/endpoints/products';

export class DeactivateProductHandler implements IDeactivateProduct {
  constructor(private readonly httpClient: IHttpClient) {}

  async deactivate(id: string): Promise<Product> {
    const response = await this.httpClient.request<undefined, Product>({
      url: productsEndpoints.productDeactivate(id),
      method: 'PATCH',
    });
    return response.body;
  }
}
