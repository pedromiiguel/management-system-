import { useQuery } from '@tanstack/react-query';
import { makeSearchProductCatalog } from '@/main/factories/handlers/products';

/** Listagem principal (paginada, ativos e inativos) — usada por ProductsPage. */
export function useProductCatalogQuery(search: string, page: number) {
  return useQuery({
    queryKey: ['products', 'list', search, page],
    queryFn: () =>
      makeSearchProductCatalog().search({ search: search || undefined, page, perPage: 50, activeOnly: false }),
  });
}

/**
 * Busca incremental (só ativos, sem paginação) — usada por StockEntryModal e
 * AdjustModal (ambos em `presentation/flows/stock`) para escolher o produto.
 * Reuso cross-domínio deliberado do catálogo de `products` (Decisão 2 da ADR 0008).
 */
export function useProductSearchQuery(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: () => makeSearchProductCatalog().search({ search, perPage: 6 }),
    enabled,
  });
}
