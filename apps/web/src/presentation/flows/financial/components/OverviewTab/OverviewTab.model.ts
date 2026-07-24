import { useQueries } from '@tanstack/react-query';
import { toDateInput } from '@/lib/format';
import { makeGetSalesTotal } from '@/main/factories/handlers/financial';
import { useFinancialDashboardQuery } from '@/main/factories/queries/financial';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function useOverviewTabModel() {
  const { data: dashboard } = useFinancialDashboardQuery();

  // Faturamento mês a mês (6 meses) — agregados leves por mês.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { from: d, to: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  });
  const monthQueries = useQueries({
    queries: months.map((m) => ({
      queryKey: ['reports', 'sales', toDateInput(m.from), toDateInput(m.to)],
      queryFn: () => makeGetSalesTotal().get(toDateInput(m.from), toDateInput(m.to)),
      staleTime: 60_000,
    })),
  });
  const monthTotals = monthQueries.map((q) => Number(q.data?.total ?? 0));
  const monthLabels = months.map((m) => MONTH_LABELS[m.from.getMonth()]!);

  const totalByMethod = (dashboard?.byMethodMonth ?? []).reduce((acc, m) => acc + Number(m.total), 0);
  const target = dashboard?.target;
  const targetPct = target?.progress ? Math.round(Number(target.progress) * 100) : null;

  return { dashboard, monthTotals, monthLabels, totalByMethod, targetPct };
}
