import type { Customer } from '@/domain/models/sale';

export interface ICreateCustomer {
  create: (name: string) => Promise<Customer>;
}
