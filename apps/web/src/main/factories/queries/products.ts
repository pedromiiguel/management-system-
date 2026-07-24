import { useQuery } from '@tanstack/react-query';
import { makeGetStockAlerts, makeSearchProductCatalog } from '@/main/factories/handlers/products';

/** Listagem principal (paginada, ativos e inativos) — usada por ProductsPage. */
export function useProductCatalogQuery(search: string, page: number) {
  return useQuery({
    queryKey: ['products', 'list', search, page],
    queryFn: () =>
      makeSearchProductCatalog().search({ search: search || undefined, page, perPage: 50, activeOnly: false }),
  });
}

/** Busca incremental (só ativos, sem paginação) — usada por StockEntryModal para escolher o produto. */
export function useProductSearchQuery(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['products', 'search', search],
    queryFn: () => makeSearchProductCatalog().search({ search, perPage: 6 }),
    enabled,
  });
}

export function useStockAlertsQuery() {
  return useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: () => makeGetStockAlerts().get(),
  });
}
