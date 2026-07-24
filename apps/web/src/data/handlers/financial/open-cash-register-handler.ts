import type { IHttpClient } from '@/@contracts/http';
import type { CashRegister, OpenRegisterInput } from '@/domain/models/financial';
import type { IOpenCashRegister } from '@/domain/usecases/financial/open-cash-register';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class OpenCashRegisterHandler implements IOpenCashRegister {
  constructor(private readonly httpClient: IHttpClient) {}

  async open(input: OpenRegisterInput): Promise<CashRegister> {
    const response = await this.httpClient.request<OpenRegisterInput, CashRegister>({
      url: financialEndpoints.cashRegisterOpen(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
