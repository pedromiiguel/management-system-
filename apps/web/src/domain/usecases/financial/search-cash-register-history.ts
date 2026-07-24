import type { CashRegister } from '@/domain/models/financial';

export interface ISearchCashRegisterHistory {
  search: () => Promise<CashRegister[]>;
}
