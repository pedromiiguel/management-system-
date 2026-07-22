import type { IHttpClient } from '@/@contracts/http';
import type { Customer } from '@/domain/models/sale';
import type { ISearchCustomer } from '@/domain/usecases/sale/search-customer';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class SearchCustomerHandler implements ISearchCustomer {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(query: string): Promise<Customer[]> {
    const response = await this.httpClient.request<undefined, Customer[]>({
      url: saleEndpoints.customers(),
      method: 'GET',
      queryParams: { search: query },
    });
    return response.body;
  }
}
