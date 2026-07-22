import type { IHttpClient } from '@/@contracts/http';
import type { Product } from '@/domain/models/sale';
import type { ISearchProduct } from '@/domain/usecases/sale/search-product';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class SearchProductHandler implements ISearchProduct {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(query: string, perPage: number): Promise<{ items: Product[] }> {
    const response = await this.httpClient.request<undefined, { items: Product[] }>({
      url: saleEndpoints.products(),
      method: 'GET',
      queryParams: { search: query, perPage },
    });
    return response.body;
  }
}
