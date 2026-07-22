import type { Customer } from '@/domain/models/sale';

export interface ISearchCustomer {
  search: (query: string) => Promise<Customer[]>;
}
