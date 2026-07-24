import type { Payable } from '@/domain/models/financial';

export interface ISearchPayable {
  search: (status?: 'OPEN' | 'PAID') => Promise<Payable[]>;
}
