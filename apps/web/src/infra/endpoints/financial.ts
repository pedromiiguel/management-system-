export const financialEndpoints = {
  dashboard: () => '/financial/dashboard',
  // Pertence conceitualmente ao domínio de reports (fora de escopo — ver
  // "desvio deliberado" no ADR 0006), não ao de financial.
  salesTotal: () => '/reports/sales',
  cashRegisterCurrent: () => '/cash-register/current',
  cashRegisterHistory: () => '/cash-register/history',
  cashRegisterOpen: () => '/cash-register/open',
  cashRegisterMovements: () => '/cash-register/movements',
  cashRegisterClose: () => '/cash-register/close',
  receivables: () => '/receivables',
  receivableSettle: (id: string) => `/receivables/${id}/settle`,
  payables: () => '/payables',
  payablePay: (id: string) => `/payables/${id}/pay`,
  cashFlow: () => '/financial/cash-flow',
  entries: () => '/financial/entries',
  categories: () => '/financial/categories',
};
