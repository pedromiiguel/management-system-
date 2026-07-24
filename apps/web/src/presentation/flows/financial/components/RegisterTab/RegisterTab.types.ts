import type { ReactNode } from 'react';
import type { CashRegister } from '@/domain/models/financial';

export type RegisterModal = 'none' | 'open' | 'move' | 'close';

export type TableRow = { key: string; cells: ReactNode[] };

export type RegisterTabViewProps = {
  register: CashRegister | null | undefined;
  movementRows: TableRow[];
  historyRows: TableRow[];
  modal: RegisterModal;
  onOpenModal: (modal: RegisterModal) => void;
  onCloseModal: () => void;
  onOpenRegister: (openingBalance: number) => void;
  onMoved: () => void;
  onClosed: () => void;
};
