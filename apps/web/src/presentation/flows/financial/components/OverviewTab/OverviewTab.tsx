import { useOverviewTabModel } from './OverviewTab.model';
import { OverviewTabView } from './OverviewTab.view';

export function OverviewTab() {
  const { dashboard, monthTotals, monthLabels, totalByMethod, targetPct } = useOverviewTabModel();

  return (
    <OverviewTabView
      dashboard={dashboard}
      monthTotals={monthTotals}
      monthLabels={monthLabels}
      totalByMethod={totalByMethod}
      targetPct={targetPct}
    />
  );
}
