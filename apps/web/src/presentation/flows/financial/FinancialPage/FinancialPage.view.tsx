import { Screen } from '@/presentation/components/Screen';
import { SChip, SSeg } from '@/components/sol';
import { EntriesTab } from '../components/EntriesTab';
import { OverviewTab } from '../components/OverviewTab';
import { PayablesTab } from '../components/PayablesTab';
import { ReceivablesTab } from '../components/ReceivablesTab';
import { RegisterTab } from '../components/RegisterTab';
import type { FinancialPageViewProps, FinancialTab } from './FinancialPage.types';

const TABS: { id: FinancialTab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'register', label: 'Caixa' },
  { id: 'receivables', label: 'Fiado (a receber)' },
  { id: 'payables', label: 'Contas a pagar' },
  { id: 'entries', label: 'Fluxo & lançamentos' },
];

export function FinancialPageView({ tab, onChangeTab, monthLabel }: FinancialPageViewProps) {
  return (
    <Screen title="Financeiro" topRight={<SChip active>{monthLabel}</SChip>}>
      <div className="flex flex-col gap-3 h-full">
        <SSeg<FinancialTab> items={TABS} active={tab} onChange={onChangeTab} />
        {tab === 'overview' ? <OverviewTab /> : null}
        {tab === 'register' ? <RegisterTab /> : null}
        {tab === 'receivables' ? <ReceivablesTab /> : null}
        {tab === 'payables' ? <PayablesTab /> : null}
        {tab === 'entries' ? <EntriesTab /> : null}
      </div>
    </Screen>
  );
}
