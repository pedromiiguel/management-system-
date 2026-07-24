import type { Product, UpdateProductInput } from '@/domain/models/products';

export interface IUpdateProduct {
  update: (id: string, input: UpdateProductInput) => Promise<Product>;
}
