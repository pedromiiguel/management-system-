import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Product } from '@/domain/models/sale';

// Filtro de busca — form RHF sem validação (só lê o valor via watch).
export type SearchFilterInput = {
  search: string;
};

export type ProductRow = {
  key: string;
  onClick: () => void;
  cells: [string, number, string];
};

export type SearchModalProps = {
  initialQuery?: string;
  onPick: (product: Product) => void;
  onClose: () => void;
};

export type SearchModalViewProps = {
  register: UseFormRegister<SearchFilterInput>;
  rows: ProductRow[];
  emptyText: string;
  onSubmit: ReturnType<UseFormHandleSubmit<SearchFilterInput>>;
  onClose: () => void;
};
