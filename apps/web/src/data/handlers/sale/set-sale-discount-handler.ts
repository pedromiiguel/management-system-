import type { IHttpClient } from '@/@contracts/http';
import type { DiscountInput, Sale } from '@/domain/models/sale';
import type { ISetSaleDiscount } from '@/domain/usecases/sale/set-sale-discount';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class SetSaleDiscountHandler implements ISetSaleDiscount {
  constructor(private readonly httpClient: IHttpClient) {}

  async set(saleId: string, discount: DiscountInput | null): Promise<Sale> {
    const response = await this.httpClient.request<DiscountInput | null, Sale>({
      url: saleEndpoints.saleDiscount(saleId),
      method: 'PUT',
      body: discount,
    });
    return response.body;
  }
}
