import type { IHttpClient } from '@/@contracts/http';
import type { Paginated, Product } from '@/domain/models/products';
import type {
  ISearchProductCatalog,
  SearchProductCatalogParams,
} from '@/domain/usecases/products/search-product-catalog';
import { productsEndpoints } from '@/infra/endpoints/products';

export class SearchProductCatalogHandler implements ISearchProductCatalog {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(params: SearchProductCatalogParams): Promise<Paginated<Product>> {
    const response = await this.httpClient.request<undefined, Paginated<Product>>({
      url: productsEndpoints.products(),
      method: 'GET',
      queryParams: {
        search: params.search || undefined,
        page: params.page,
        perPage: params.perPage,
        // Controller espera 'all' === 'true' para trazer produtos inativos —
        // omitido (ativos só) quando activeOnly não é explicitamente false.
        all: params.activeOnly === false ? 'true' : undefined,
      },
    });
    return response.body;
  }
}
