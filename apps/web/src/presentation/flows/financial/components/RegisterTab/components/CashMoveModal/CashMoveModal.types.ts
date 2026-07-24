import type { CashMovementType } from '@beverage/shared';

export type CashMoveModalProps = {
  onDone: () => void;
  onClose: () => void;
};

export type CashMoveModalViewProps = {
  type: CashMovementType;
  raw: string;
  description: string;
  descriptionPlaceholder: string;
  valid: boolean;
  saving: boolean;
  onChangeType: (type: CashMovementType) => void;
  onChangeRaw: (raw: string) => void;
  onChangeDescription: (description: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};
