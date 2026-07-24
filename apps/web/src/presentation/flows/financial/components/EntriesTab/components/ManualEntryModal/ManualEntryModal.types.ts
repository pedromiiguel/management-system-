import type { FinancialCategory } from '@/domain/models/financial';

export type ManualEntryKind = 'INCOME' | 'EXPENSE';

export type ManualEntryModalProps = {
  onDone: () => void;
  onClose: () => void;
};

export type ManualEntryModalViewProps = {
  kind: ManualEntryKind;
  raw: string;
  description: string;
  categoryId: string;
  categories: FinancialCategory[];
  valid: boolean;
  saving: boolean;
  onChangeKind: (kind: ManualEntryKind) => void;
  onChangeRaw: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeCategoryId: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};
