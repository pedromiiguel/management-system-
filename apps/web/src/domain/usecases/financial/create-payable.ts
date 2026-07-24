import type { Payable, PayableInput } from '@/domain/models/financial';

export interface ICreatePayable {
  create: (input: PayableInput) => Promise<Payable>;
}
