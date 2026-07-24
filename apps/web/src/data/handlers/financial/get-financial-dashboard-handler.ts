import type { IHttpClient } from '@/@contracts/http';
import type { Dashboard } from '@/domain/models/financial';
import type { IGetFinancialDashboard } from '@/domain/usecases/financial/get-financial-dashboard';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class GetFinancialDashboardHandler implements IGetFinancialDashboard {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(): Promise<Dashboard> {
    const response = await this.httpClient.request<undefined, Dashboard>({
      url: financialEndpoints.dashboard(),
      method: 'GET',
    });
    return response.body;
  }
}
