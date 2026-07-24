import type { IHttpClient } from '@/@contracts/http';
import type { CashFlow, IGetCashFlow } from '@/domain/usecases/financial/get-cash-flow';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class GetCashFlowHandler implements IGetCashFlow {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(from: string, to: string): Promise<CashFlow> {
    const response = await this.httpClient.request<undefined, CashFlow>({
      url: financialEndpoints.cashFlow(),
      method: 'GET',
      queryParams: { from, to },
    });
    return response.body;
  }
}
