import { useQuery } from '@tanstack/react-query';
import { makeSearchCustomer, makeSearchProduct } from '@/main/factories/handlers/sale';

export function useSearchProductsQuery(query: string, perPage: number) {
  return useQuery({
    queryKey: ['products', 'suggest', query, perPage],
    queryFn: () => makeSearchProduct().search(query, perPage),
    enabled: query.length >= 2,
  });
}

export function useSearchCustomersQuery(query: string) {
  return useQuery({
    queryKey: ['customers', query],
    queryFn: () => makeSearchCustomer().search(query),
  });
}
