import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Product } from '@/domain/models/products';
import type { AdjustmentFormInput } from './AdjustModal.schema';

export type AdjustModalProps = {
  onSaved: () => void;
  onClose: () => void;
};

export type ProductPickRow = {
  key: string;
  onClick: () => void;
  cells: [string, number];
};

export type AdjustFilterInput = { search: string };

export type AdjustModalViewProps = {
  picked: Product | null;
  onUnpick: () => void;
  registerFilter: UseFormRegister<AdjustFilterInput>;
  showResults: boolean;
  rows: ProductPickRow[];
  register: UseFormRegister<AdjustmentFormInput>;
  errors: FieldErrors<AdjustmentFormInput>;
  onSubmit: ReturnType<UseFormHandleSubmit<AdjustmentFormInput>>;
  saving: boolean;
  canSubmit: boolean;
  onClose: () => void;
};
