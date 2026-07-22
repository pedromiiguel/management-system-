import type { IHttpClient } from '@/@contracts/http';
import type { AddSaleItemInput, Sale } from '@/domain/models/sale';
import type { IAddSaleItem } from '@/domain/usecases/sale/add-sale-item';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class AddSaleItemHandler implements IAddSaleItem {
  constructor(private readonly httpClient: IHttpClient) {}

  async add(saleId: string, input: AddSaleItemInput): Promise<{ sale: Sale; warning: string | null }> {
    const response = await this.httpClient.request<AddSaleItemInput, { sale: Sale; warning: string | null }>({
      url: saleEndpoints.saleItems(saleId),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
