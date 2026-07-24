import type { Dashboard } from '@/domain/models/financial';

export type OverviewTabViewProps = {
  dashboard: Dashboard | undefined;
  monthTotals: number[];
  monthLabels: string[];
  totalByMethod: number;
  targetPct: number | null;
};
