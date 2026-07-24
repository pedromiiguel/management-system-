import type { ReactNode } from 'react';

export type EntryRow = { key: string; cells: ReactNode[] };

export type EntriesTabViewProps = {
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  inflows: number;
  outflows: number;
  balance: number;
  rows: EntryRow[];
  creating: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
  onCreated: () => void;
};
