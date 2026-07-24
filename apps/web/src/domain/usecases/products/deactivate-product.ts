import type { Product } from '@/domain/models/products';

export interface IDeactivateProduct {
  deactivate: (id: string) => Promise<Product>;
}
