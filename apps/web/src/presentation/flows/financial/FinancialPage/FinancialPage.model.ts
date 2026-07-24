import { useState } from 'react';
import type { FinancialTab } from './FinancialPage.types';

export function useFinancialPageModel() {
  const [tab, setTab] = useState<FinancialTab>('overview');
  return { tab, setTab };
}
