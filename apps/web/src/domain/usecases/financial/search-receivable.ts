import type { Receivable } from '@/domain/models/financial';

export type SearchReceivableParams = { customerId?: string; status?: 'OPEN' | 'RECEIVED' };

export interface ISearchReceivable {
  search: (params?: SearchReceivableParams) => Promise<Receivable[]>;
}
