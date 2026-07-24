import type { Paginated, Product } from '@/domain/models/products';

export interface SearchProductCatalogParams {
  search?: string;
  page?: number;
  perPage?: number;
  /** false traz todos (ativos e inativos) — usado pela listagem principal. */
  activeOnly?: boolean;
}

/**
 * Nome deliberadamente distinto de `ISearchProduct` (domain/usecases/sale) —
 * mesma entidade, contrato diferente (busca rápida sem paginação vs.
 * listagem paginada e filtrável do catálogo). Ver Decisão 2 da ADR 0007.
 */
export interface ISearchProductCatalog {
  search: (params: SearchProductCatalogParams) => Promise<Paginated<Product>>;
}
