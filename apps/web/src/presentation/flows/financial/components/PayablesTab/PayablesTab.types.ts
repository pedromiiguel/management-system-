import type { ReactNode } from 'react';

export type PayableRow = { key: string; cells: ReactNode[] };

export type PayablesTabViewProps = {
  rows: PayableRow[];
  creating: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  onCreated: () => void;
};
