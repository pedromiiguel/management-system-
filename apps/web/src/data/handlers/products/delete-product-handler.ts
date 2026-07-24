import type { IHttpClient } from '@/@contracts/http';
import type { IDeleteProduct } from '@/domain/usecases/products/delete-product';
import { productsEndpoints } from '@/infra/endpoints/products';

export class DeleteProductHandler implements IDeleteProduct {
  constructor(private readonly httpClient: IHttpClient) {}

  async delete(id: string): Promise<{ deleted: boolean }> {
    const response = await this.httpClient.request<undefined, { deleted: boolean }>({
      url: productsEndpoints.product(id),
      method: 'DELETE',
    });
    return response.body;
  }
}
