import type { CashMovement } from '@/domain/models/financial';

export type CashFlow = {
  movements: CashMovement[];
  inflows: number;
  outflows: number;
  balance: number;
};

export interface IGetCashFlow {
  get: (from: string, to: string) => Promise<CashFlow>;
}
