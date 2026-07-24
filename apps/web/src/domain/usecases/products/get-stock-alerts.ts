import type { StockAlerts } from '@/domain/models/stock';

export interface IGetStockAlerts {
  get: () => Promise<StockAlerts>;
}
