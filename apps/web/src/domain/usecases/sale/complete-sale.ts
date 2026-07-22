import type { CompleteSaleInput, Sale } from '@/domain/models/sale';

export interface ICompleteSale {
  complete: (saleId: string, input: CompleteSaleInput) => Promise<Sale>;
}
