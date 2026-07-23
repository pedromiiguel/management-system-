import type { Sale } from '@/domain/models/sale';

export type Modal =
  | { kind: 'none' }
  | { kind: 'search'; initialQuery?: string }
  | { kind: 'discount' }
  | { kind: 'customer' }
  | { kind: 'confirm-cancel' }
  | { kind: 'receipt'; sale: Sale };

export type SalePageProps = {
  operatorName: string | undefined;
};
