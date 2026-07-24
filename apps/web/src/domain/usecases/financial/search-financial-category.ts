import type { FinancialCategory } from '@/domain/models/financial';

export interface ISearchFinancialCategory {
  search: () => Promise<FinancialCategory[]>;
}
