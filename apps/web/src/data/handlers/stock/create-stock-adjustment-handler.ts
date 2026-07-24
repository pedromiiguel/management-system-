import type { IHttpClient } from '@/@contracts/http';
import type { StockAdjustmentInput } from '@/domain/models/stock';
import type { ICreateStockAdjustment } from '@/domain/usecases/stock/create-stock-adjustment';
import { stockEndpoints } from '@/infra/endpoints/stock';

export class CreateStockAdjustmentHandler implements ICreateStockAdjustment {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(
    input: StockAdjustmentInput,
  ): Promise<{ id: string; type: 'ENTRY' | 'EXIT'; quantity: number }> {
    const response = await this.httpClient.request<
      StockAdjustmentInput,
      { id: string; type: 'ENTRY' | 'EXIT'; quantity: number }
    >({
      url: stockEndpoints.stockAdjustments(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
