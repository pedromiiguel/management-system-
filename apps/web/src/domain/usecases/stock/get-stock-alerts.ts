import type { StockAlerts } from '@/domain/models/stock';

/** Movido de `domain/usecases/products` nesta rodada (Decisão 1 da ADR 0008). */
export interface IGetStockAlerts {
  get: () => Promise<StockAlerts>;
}
