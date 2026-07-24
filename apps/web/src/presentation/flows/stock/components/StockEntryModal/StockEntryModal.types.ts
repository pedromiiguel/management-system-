import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Product } from '@/domain/models/products';
import type { StockEntryFormInput } from './StockEntryModal.schema';

export type StockEntryModalProps = {
  product?: Product;
  onSaved: () => void;
  onClose: () => void;
};

export type ProductPickRow = {
  key: string;
  onClick: () => void;
  cells: [string, number];
};

export type StockEntryFilterInput = { search: string };

export type StockEntryModalViewProps = {
  picked: Product | null;
  onUnpick: () => void;
  registerFilter: UseFormRegister<StockEntryFilterInput>;
  showResults: boolean;
  rows: ProductPickRow[];
  register: UseFormRegister<StockEntryFormInput>;
  errors: FieldErrors<StockEntryFormInput>;
  onSubmit: ReturnType<UseFormHandleSubmit<StockEntryFormInput>>;
  saving: boolean;
  onClose: () => void;
};
