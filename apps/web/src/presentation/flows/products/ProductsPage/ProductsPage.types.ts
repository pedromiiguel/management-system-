import type { ReactNode } from 'react';
import type { Product } from '@/domain/models/products';

export type ProductFilter = 'all' | 'active' | 'low' | 'expiring';

export type ProductModalState =
  | { kind: 'none' }
  | { kind: 'product'; product?: Product }
  | { kind: 'entry'; product?: Product };

export type ProductRow = {
  key: string;
  onClick: () => void;
  cells: ReactNode[];
};

export type ProductsPageViewProps = {
  search: string;
  onChangeSearch: (value: string) => void;
  filter: ProductFilter;
  onChangeFilter: (filter: ProductFilter) => void;
  total: number;
  lowCount: number;
  expiringCount: number;
  rows: ProductRow[];
  page: number;
  hasNextPage: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  modal: ProductModalState;
  onOpenNewProduct: () => void;
  onOpenNewEntry: () => void;
  onCloseModal: () => void;
  onSaved: () => void;
};
