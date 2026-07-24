import { useState } from 'react';
import { useStockAlertsQuery, useStockMovementsQuery } from '@/main/factories/queries/stock';
import type { StockModalState } from './StockPage.types';

export function useStockPageModel() {
  const [modal, setModal] = useState<StockModalState>('none');

  const { data: alerts } = useStockAlertsQuery();
  const { data: movements = [], refetch } = useStockMovementsQuery();

  const onSaved = () => {
    setModal('none');
    void refetch();
  };

  return { modal, setModal, alerts, movements, onSaved };
}
