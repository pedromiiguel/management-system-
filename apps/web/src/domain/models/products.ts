export interface Product {
  id: string;
  sku: string;
  ean: string | null;
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
}

/**
 * Genérico o bastante para não ser exclusivo de Product, mas nasce aqui
 * porque `products` é o primeiro domínio migrado que precisa dele — mesmo
 * espírito do desvio do `IGetSalesTotal` na ADR 0006 (fica onde nasceu até
 * um segundo domínio precisar, aí sim vira um lugar compartilhado).
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export type { ProductInput, UpdateProductInput, ProductStockEntryInput } from '@beverage/shared';
