import type { CashRegister, CloseRegisterInput } from '@/domain/models/financial';

export interface ICloseCashRegister {
  close: (input: CloseRegisterInput) => Promise<CashRegister>;
}
