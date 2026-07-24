import type { IHttpClient } from '@/@contracts/http';
import type { StockAlerts } from '@/domain/models/stock';
import type { IGetStockAlerts } from '@/domain/usecases/stock/get-stock-alerts';
import { stockEndpoints } from '@/infra/endpoints/stock';

export class GetStockAlertsHandler implements IGetStockAlerts {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(): Promise<StockAlerts> {
    const response = await this.httpClient.request<undefined, StockAlerts>({
      url: stockEndpoints.stockAlerts(),
      method: 'GET',
    });
    return response.body;
  }
}
