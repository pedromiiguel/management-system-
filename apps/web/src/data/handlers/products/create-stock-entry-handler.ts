import type { IHttpClient } from '@/@contracts/http';
import type { StockEntryInput } from '@/domain/models/products';
import type { ICreateStockEntry } from '@/domain/usecases/products/create-stock-entry';
import { productsEndpoints } from '@/infra/endpoints/products';

export class CreateStockEntryHandler implements ICreateStockEntry {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: StockEntryInput): Promise<{ currentStock: number }> {
    const response = await this.httpClient.request<StockEntryInput, { currentStock: number }>({
      url: productsEndpoints.stockEntries(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
