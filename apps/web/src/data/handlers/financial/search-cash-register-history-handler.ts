import type { IHttpClient } from '@/@contracts/http';
import type { CashRegister } from '@/domain/models/financial';
import type { ISearchCashRegisterHistory } from '@/domain/usecases/financial/search-cash-register-history';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class SearchCashRegisterHistoryHandler implements ISearchCashRegisterHistory {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(): Promise<CashRegister[]> {
    const response = await this.httpClient.request<undefined, CashRegister[]>({
      url: financialEndpoints.cashRegisterHistory(),
      method: 'GET',
    });
    return response.body;
  }
}
