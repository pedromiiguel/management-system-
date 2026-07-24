import type { ReactNode } from 'react';
import type { Receivable } from '@/domain/models/financial';

export type ReceivableRow = { key: string; cells: ReactNode[] };

export type ReceivablesTabViewProps = {
  totalOpen: number;
  rows: ReceivableRow[];
  settling: Receivable | null;
  onSettle: (paymentMethod: 'CASH' | 'PIX' | 'CARD') => void;
  onCloseSettle: () => void;
};
