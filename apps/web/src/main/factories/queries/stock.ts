import { useQuery } from '@tanstack/react-query';
import { makeGetStockAlerts, makeSearchStockMovements } from '@/main/factories/handlers/stock';

/** Movida de main/factories/queries/products — também consumida por ProductsPage (Decisão 1 da ADR 0008). */
export function useStockAlertsQuery() {
  return useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: () => makeGetStockAlerts().get(),
  });
}

export function useStockMovementsQuery() {
  return useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: () => makeSearchStockMovements().search(),
  });
}
