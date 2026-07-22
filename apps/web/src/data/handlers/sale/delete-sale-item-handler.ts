import type { IHttpClient } from '@/@contracts/http';
import type { Sale } from '@/domain/models/sale';
import type { IDeleteSaleItem } from '@/domain/usecases/sale/delete-sale-item';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class DeleteSaleItemHandler implements IDeleteSaleItem {
  constructor(private readonly httpClient: IHttpClient) {}

  async delete(saleId: string, itemId: string): Promise<Sale> {
    const response = await this.httpClient.request<undefined, Sale>({
      url: saleEndpoints.saleItem(saleId, itemId),
      method: 'DELETE',
    });
    return response.body;
  }
}
