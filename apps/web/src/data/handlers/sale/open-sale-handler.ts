import type { IHttpClient } from '@/@contracts/http';
import type { Sale } from '@/domain/models/sale';
import type { IOpenSale } from '@/domain/usecases/sale/open-sale';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class OpenSaleHandler implements IOpenSale {
  constructor(private readonly httpClient: IHttpClient) {}

  async open(): Promise<Sale> {
    const response = await this.httpClient.request<undefined, Sale>({
      url: saleEndpoints.sales(),
      method: 'POST',
    });
    return response.body;
  }
}
