import type { CashMovement, CashMovementInput } from '@/domain/models/financial';

export interface ICreateCashMovement {
  create: (input: CashMovementInput) => Promise<CashMovement>;
}
