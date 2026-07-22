import type { IHttpClient } from '@/@contracts/http';
import type { Customer } from '@/domain/models/sale';
import type { ICreateCustomer } from '@/domain/usecases/sale/create-customer';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class CreateCustomerHandler implements ICreateCustomer {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(name: string): Promise<Customer> {
    const response = await this.httpClient.request<{ name: string }, Customer>({
      url: saleEndpoints.customers(),
      method: 'POST',
      body: { name },
    });
    return response.body;
  }
}
