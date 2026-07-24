import type { CashMovement, ManualEntryInput } from '@/domain/models/financial';

export interface ICreateFinancialEntry {
  create: (input: ManualEntryInput) => Promise<CashMovement>;
}
