import type { Receivable, SettleReceivableInput } from '@/domain/models/financial';

export interface ISettleReceivable {
  settle: (id: string, input: SettleReceivableInput) => Promise<Receivable>;
}
