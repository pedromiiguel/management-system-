import type { StockMovement } from '@/domain/models/stock';

/**
 * Filtrado por `productId`, mas não paginado (`take: 200` fixo no backend) —
 * mesmo formato de `ISearchProduct` (`domain/usecases/sale`, sem paginação).
 * Nome `Search`, não `Get`, porque aceita filtro (ver Decisão 2 da ADR 0008).
 */
export interface ISearchStockMovements {
  search: (productId?: string) => Promise<StockMovement[]>;
}
