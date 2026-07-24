import type { IHttpClient } from '@/@contracts/http';
import type { StockAlerts } from '@/domain/models/stock';
import type { IGetStockAlerts } from '@/domain/usecases/products/get-stock-alerts';
import { productsEndpoints } from '@/infra/endpoints/products';

export class GetStockAlertsHandler implements IGetStockAlerts {
  constructor(private readonly httpClient: IHttpClient) {}

  async get(): Promise<StockAlerts> {
    const response = await this.httpClient.request<undefined, StockAlerts>({
      url: productsEndpoints.stockAlerts(),
      method: 'GET',
    });
    return response.body;
  }
}
