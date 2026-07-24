import type { StockEntryInput } from '@/domain/models/products';

/**
 * Pertence conceitualmente ao domínio `stock`, não a `products` — fica aqui
 * até `stock.tsx` migrar (mesmo desvio do `IGetSalesTotal` na ADR 0006). Ver
 * Decisão 1 da ADR 0007.
 */
export interface ICreateStockEntry {
  create: (input: StockEntryInput) => Promise<{ currentStock: number }>;
}
