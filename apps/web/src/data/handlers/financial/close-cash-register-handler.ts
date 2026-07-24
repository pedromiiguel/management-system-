import type { IHttpClient } from '@/@contracts/http';
import type { CashRegister, CloseRegisterInput } from '@/domain/models/financial';
import type { ICloseCashRegister } from '@/domain/usecases/financial/close-cash-register';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class CloseCashRegisterHandler implements ICloseCashRegister {
  constructor(private readonly httpClient: IHttpClient) {}

  async close(input: CloseRegisterInput): Promise<CashRegister> {
    const response = await this.httpClient.request<CloseRegisterInput, CashRegister>({
      url: financialEndpoints.cashRegisterClose(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
