import type { IHttpClient } from '@/@contracts/http';
import type { Payable } from '@/domain/models/financial';
import type { ISearchPayable } from '@/domain/usecases/financial/search-payable';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class SearchPayableHandler implements ISearchPayable {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(status?: 'OPEN' | 'PAID'): Promise<Payable[]> {
    const response = await this.httpClient.request<undefined, Payable[]>({
      url: financialEndpoints.payables(),
      method: 'GET',
      queryParams: { status },
    });
    return response.body;
  }
}
