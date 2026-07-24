import type { IHttpClient } from '@/@contracts/http';
import type { StockEntryInput } from '@/domain/models/stock';
import type { ICreateStockEntry } from '@/domain/usecases/stock/create-stock-entry';
import { stockEndpoints } from '@/infra/endpoints/stock';

export class CreateStockEntryHandler implements ICreateStockEntry {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: StockEntryInput): Promise<{ currentStock: number }> {
    const response = await this.httpClient.request<StockEntryInput, { currentStock: number }>({
      url: stockEndpoints.stockEntries(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
