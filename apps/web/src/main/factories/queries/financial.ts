import { useQuery } from '@tanstack/react-query';
import {
  makeGetCashFlow,
  makeGetCurrentCashRegister,
  makeGetFinancialDashboard,
  makeGetSalesTotal,
  makeSearchCashRegisterHistory,
  makeSearchFinancialCategory,
  makeSearchPayable,
  makeSearchReceivable,
} from '@/main/factories/handlers/financial';

export function useFinancialDashboardQuery() {
  return useQuery({
    queryKey: ['financial', 'dashboard'],
    queryFn: () => makeGetFinancialDashboard().get(),
  });
}

export function useSalesTotalQuery(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'sales', from, to],
    queryFn: () => makeGetSalesTotal().get(from, to),
    staleTime: 60_000,
  });
}

export function useCurrentCashRegisterQuery() {
  return useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => makeGetCurrentCashRegister().get(),
  });
}

export function useCashRegisterHistoryQuery() {
  return useQuery({
    queryKey: ['cash-register', 'history'],
    queryFn: () => makeSearchCashRegisterHistory().search(),
  });
}

export function useReceivablesQuery() {
  return useQuery({
    queryKey: ['receivables', 'open'],
    queryFn: () => makeSearchReceivable().search(),
  });
}

export function usePayablesQuery() {
  return useQuery({
    queryKey: ['payables', 'open'],
    queryFn: () => makeSearchPayable().search(),
  });
}

export function useCashFlowQuery(from: string, to: string) {
  return useQuery({
    queryKey: ['financial', 'cash-flow', from, to],
    queryFn: () => makeGetCashFlow().get(from, to),
  });
}

/** Busca todas as categorias uma vez só — o filtro por kind é do chamador (ViewModel/Model). */
export function useFinancialCategoriesQuery() {
  return useQuery({
    queryKey: ['financial', 'categories'],
    queryFn: () => makeSearchFinancialCategory().search(),
  });
}
