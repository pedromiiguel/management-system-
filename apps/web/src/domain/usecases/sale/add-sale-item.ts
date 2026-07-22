import type { AddSaleItemInput, Sale } from '@/domain/models/sale';

export interface IAddSaleItem {
  add: (saleId: string, input: AddSaleItemInput) => Promise<{ sale: Sale; warning: string | null }>;
}
