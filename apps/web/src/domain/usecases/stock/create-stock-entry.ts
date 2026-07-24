import type { StockEntryInput } from '@/domain/models/stock';

/**
 * Movido de `domain/usecases/products` nesta rodada — pertencia
 * conceitualmente a `stock` desde a ADR 0007 (ver Decisão 1 da ADR 0008).
 */
export interface ICreateStockEntry {
  create: (input: StockEntryInput) => Promise<{ currentStock: number }>;
}
