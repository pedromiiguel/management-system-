import type { Sale } from '@/domain/models/sale';

export interface IOpenSale {
  open: () => Promise<Sale>;
}
