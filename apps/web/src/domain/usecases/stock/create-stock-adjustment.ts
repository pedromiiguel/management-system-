import type { StockAdjustmentInput } from '@/domain/models/stock';

/**
 * Ajuste manual auditável (inventário, quebra, perda) — `POST
 * /stock/adjustments`. Guarda de estoque negativo coberta pelo supertest
 * (ver Decisão 4 da ADR 0008). Resposta do backend não inclui `product`
 * (`tx.stockMovement.create` sem `include`), diferente da listagem.
 */
export interface ICreateStockAdjustment {
  create: (
    input: StockAdjustmentInput,
  ) => Promise<{ id: string; type: 'ENTRY' | 'EXIT'; quantity: number }>;
}
