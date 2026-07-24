import type { FinancialCategory } from '@/domain/models/financial';

export type PayableModalProps = {
  onDone: () => void;
  onClose: () => void;
};

export type PayableModalViewProps = {
  description: string;
  supplier: string;
  raw: string;
  dueDate: string;
  categoryId: string;
  categories: FinancialCategory[];
  valid: boolean;
  saving: boolean;
  onChangeDescription: (value: string) => void;
  onChangeSupplier: (value: string) => void;
  onChangeRaw: (value: string) => void;
  onChangeDueDate: (value: string) => void;
  onChangeCategoryId: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};
