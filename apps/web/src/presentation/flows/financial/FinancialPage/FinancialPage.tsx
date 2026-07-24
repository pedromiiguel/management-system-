import { useFinancialPageModel } from './FinancialPage.model';
import { FinancialPageView } from './FinancialPage.view';

export function FinancialPage() {
  const { tab, setTab } = useFinancialPageModel();
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return <FinancialPageView tab={tab} onChangeTab={setTab} monthLabel={monthLabel} />;
}
