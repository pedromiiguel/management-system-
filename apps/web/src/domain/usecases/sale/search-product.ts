import type { Product } from '@/domain/models/sale';

export interface ISearchProduct {
  search: (query: string, perPage: number) => Promise<{ items: Product[] }>;
}
