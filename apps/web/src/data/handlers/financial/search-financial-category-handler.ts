import type { IHttpClient } from '@/@contracts/http';
import type { FinancialCategory } from '@/domain/models/financial';
import type { ISearchFinancialCategory } from '@/domain/usecases/financial/search-financial-category';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class SearchFinancialCategoryHandler implements ISearchFinancialCategory {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(): Promise<FinancialCategory[]> {
    const response = await this.httpClient.request<undefined, FinancialCategory[]>({
      url: financialEndpoints.categories(),
      method: 'GET',
    });
    return response.body;
  }
}
