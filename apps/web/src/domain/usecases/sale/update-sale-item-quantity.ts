import type { Sale, UpdateSaleItemInput } from '@/domain/models/sale';

export interface IUpdateSaleItemQuantity {
  update: (
    saleId: string,
    itemId: string,
    input: UpdateSaleItemInput,
  ) => Promise<{ sale: Sale; warning: string | null }>;
}
