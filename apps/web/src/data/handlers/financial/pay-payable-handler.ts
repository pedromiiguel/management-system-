import type { IHttpClient } from '@/@contracts/http';
import type { Payable } from '@/domain/models/financial';
import type { IPayPayable } from '@/domain/usecases/financial/pay-payable';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class PayPayableHandler implements IPayPayable {
  constructor(private readonly httpClient: IHttpClient) {}

  async pay(id: string): Promise<Payable> {
    const response = await this.httpClient.request<undefined, Payable>({
      url: financialEndpoints.payablePay(id),
      method: 'POST',
    });
    return response.body;
  }
}
