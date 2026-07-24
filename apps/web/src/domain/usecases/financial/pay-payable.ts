import type { Payable } from '@/domain/models/financial';

export interface IPayPayable {
  pay: (id: string) => Promise<Payable>;
}
