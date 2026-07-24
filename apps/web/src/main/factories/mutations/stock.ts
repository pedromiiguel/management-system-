import { useMutation } from '@tanstack/react-query';
import type { StockAdjustmentInput, StockEntryInput } from '@/domain/models/stock';
import { makeCreateStockAdjustment, makeCreateStockEntry } from '@/main/factories/handlers/stock';

/** Movida de main/factories/mutations/products — também consumida por ProductsPage (Decisão 1 da ADR 0008). */
export function useCreateStockEntryMutation() {
  return useMutation({ mutationFn: (input: StockEntryInput) => makeCreateStockEntry().create(input) });
}

export function useCreateStockAdjustmentMutation() {
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => makeCreateStockAdjustment().create(input),
  });
}
