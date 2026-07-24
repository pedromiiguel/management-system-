import type { Product, ProductInput } from '@/domain/models/products';

export interface ICreateProduct {
  create: (input: ProductInput) => Promise<Product>;
}
