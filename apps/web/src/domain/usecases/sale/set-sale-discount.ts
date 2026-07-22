import type { DiscountInput, Sale } from '@/domain/models/sale';

export interface ISetSaleDiscount {
  set: (saleId: string, discount: DiscountInput | null) => Promise<Sale>;
}
