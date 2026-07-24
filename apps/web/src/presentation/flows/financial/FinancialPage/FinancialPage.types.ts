export type FinancialTab = 'overview' | 'register' | 'receivables' | 'payables' | 'entries';

export type FinancialPageViewProps = {
  tab: FinancialTab;
  onChangeTab: (tab: FinancialTab) => void;
  monthLabel: string;
};
