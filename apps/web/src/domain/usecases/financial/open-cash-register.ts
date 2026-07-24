import type { CashRegister, OpenRegisterInput } from '@/domain/models/financial';

export interface IOpenCashRegister {
  open: (input: OpenRegisterInput) => Promise<CashRegister>;
}
