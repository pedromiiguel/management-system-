import type { IHttpClient } from '@/@contracts/http';
import type { Payable, PayableInput } from '@/domain/models/financial';
import type { ICreatePayable } from '@/domain/usecases/financial/create-payable';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class CreatePayableHandler implements ICreatePayable {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: PayableInput): Promise<Payable> {
    const response = await this.httpClient.request<PayableInput, Payable>({
      url: financialEndpoints.payables(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
