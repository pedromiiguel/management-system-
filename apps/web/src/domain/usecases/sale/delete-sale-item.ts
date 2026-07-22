import type { Sale } from '@/domain/models/sale';

export interface IDeleteSaleItem {
  delete: (saleId: string, itemId: string) => Promise<Sale>;
}
