import type { IHttpClient } from '@/@contracts/http';
import type { StockMovement } from '@/domain/models/stock';
import type { ISearchStockMovements } from '@/domain/usecases/stock/search-stock-movements';
import { stockEndpoints } from '@/infra/endpoints/stock';

export class SearchStockMovementsHandler implements ISearchStockMovements {
  constructor(private readonly httpClient: IHttpClient) {}

  async search(productId?: string): Promise<StockMovement[]> {
    const response = await this.httpClient.request<undefined, StockMovement[]>({
      url: stockEndpoints.stockMovements(),
      method: 'GET',
      queryParams: { productId },
    });
    return response.body;
  }
}
