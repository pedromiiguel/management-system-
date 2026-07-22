import type { IHttpClient } from '@/@contracts/http';
import type { ICancelSale } from '@/domain/usecases/sale/cancel-sale';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class CancelSaleHandler implements ICancelSale {
  constructor(private readonly httpClient: IHttpClient) {}

  async cancel(saleId: string): Promise<void> {
    await this.httpClient.request<undefined, unknown>({
      url: saleEndpoints.saleCancel(saleId),
      method: 'POST',
    });
  }
}
