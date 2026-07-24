import type { CashRegister } from '@/domain/models/financial';

export interface IGetCurrentCashRegister {
  get: () => Promise<CashRegister | null>;
}
