import type { IHttpClient } from '@/@contracts/http';
import type { Receivable } from '@/domain/models/financial';
import type {
  ISearchReceivable,
  SearchReceivableParams,
} from '@/domain/usecases/financial/search-receivable';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class SearchReceivableHandler implements ISearchReceivable {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(params?: SearchReceivableParams): Promise<Receivable[]> {
    const response = await this.httpClient.request<undefined, Receivable[]>({
      url: financialEndpoints.receivables(),
      method: 'GET',
      queryParams: { customerId: params?.customerId, status: params?.status },
    });
    return response.body;
  }
}
