import type { ReactNode } from 'react';

export type StockModalState = 'none' | 'entry' | 'adjust';

export type MovementRow = {
  key: string;
  cells: ReactNode[];
};

export type LowStockRow = {
  key: string;
  cells: [string, ReactNode, number];
};

export type ExpiringRow = {
  key: string;
  cells: [string, string, ReactNode, number];
};

export type StockPageViewProps = {
  movements: MovementRow[];
  lowStock: LowStockRow[];
  expiring: ExpiringRow[];
  modal: StockModalState;
  onOpenEntry: () => void;
  onOpenAdjust: () => void;
  onCloseModal: () => void;
  onSaved: () => void;
};
