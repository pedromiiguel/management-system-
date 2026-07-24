import type { IHttpClient } from '@/@contracts/http';
import type { IGetSalesTotal } from '@/domain/usecases/financial/get-sales-total';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class GetSalesTotalHandler implements IGetSalesTotal {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(from: string, to: string): Promise<{ total: number }> {
    const response = await this.httpClient.request<undefined, { total: number }>({
      url: financialEndpoints.salesTotal(),
      method: 'GET',
      queryParams: { from, to },
    });
    return response.body;
  }
}
