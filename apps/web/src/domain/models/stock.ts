/**
 * Domínio `stock` criado na ADR 0007 só para este tipo — nenhum usecase de
 * `stock` migrou ainda (ver Decisão 3 da ADR 0007). `ICreateStockEntry`
 * continua em `domain/usecases/products` por enquanto (mesmo desvio do
 * `IGetSalesTotal` na ADR 0006).
 */
export interface StockAlerts {
  lowStock: { id: string; name: string; sku: string; currentStock: number; minimumStock: number }[];
  expiring: {
    id: string;
    batch: string | null;
    expiresAt: string | null;
    quantity: number;
    product: { id: string; name: string; sku: string };
  }[];
}
