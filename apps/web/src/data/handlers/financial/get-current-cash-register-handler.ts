import type { IHttpClient } from '@/@contracts/http';
import type { CashRegister } from '@/domain/models/financial';
import type { IGetCurrentCashRegister } from '@/domain/usecases/financial/get-current-cash-register';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class GetCurrentCashRegisterHandler implements IGetCurrentCashRegister {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(): Promise<CashRegister | null> {
    const response = await this.httpClient.request<undefined, CashRegister | null>({
      url: financialEndpoints.cashRegisterCurrent(),
      method: 'GET',
    });
    return response.body;
  }
}
