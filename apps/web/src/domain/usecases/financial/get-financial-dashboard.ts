import type { Dashboard } from '@/domain/models/financial';

export interface IGetFinancialDashboard {
  get: () => Promise<Dashboard>;
}
