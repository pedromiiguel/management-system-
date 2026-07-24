import type { CashMovementType, CashRegisterStatus, PaymentMethod } from '@beverage/shared';

export interface FinancialCategory {
  id: string;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  system: boolean;
}

export type FinancialCategoryRef = Pick<FinancialCategory, 'id' | 'name'>;

export type CashMovementSale = { id: string };

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod | null;
  occurredAt: string;
  category?: FinancialCategoryRef | null;
  sale?: CashMovementSale | null;
}

export type CashRegisterOperator = { id: string; name: string };

export type CashRegisterSummary = {
  inflowsByMethod: Record<string, number>;
  pulls: number;
  floats: number;
  outflows: number;
  expectedCash: number;
};

export interface CashRegister {
  id: string;
  status: CashRegisterStatus;
  openingBalance: number;
  expectedBalance: number | null;
  countedBalance: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
  note: string | null;
  operator: CashRegisterOperator;
  movements?: CashMovement[];
  summary?: CashRegisterSummary;
}

// Não reaproveita `Customer`/`Sale` de `@/domain/models/sale` — faria o
// domínio do financial depender do domínio do sale por causa de um shape
// parcial. Mesma decisão do ADR 0005 para `SaleOperator` vs. `UserRow`.
export type ReceivableCustomer = { id: string; name: string; contact: string | null };
export type ReceivableSale = { id: string; completedAt: string | null; total: number };

export interface Receivable {
  id: string;
  amount: number;
  dueDate: string | null;
  status: 'OPEN' | 'RECEIVED';
  receivedAt: string | null;
  createdAt: string;
  customer: ReceivableCustomer;
  sale: ReceivableSale | null;
}

export interface Payable {
  id: string;
  description: string;
  supplier: string | null;
  amount: number;
  dueDate: string;
  status: 'OPEN' | 'PAID';
  paidAt: string | null;
  category: FinancialCategoryRef | null;
}

export type DashboardRevenueByMethod = { paymentMethod: PaymentMethod; total: number; count: number };

export interface Dashboard {
  revenue: { day: number; month: number; year: number };
  byMethodMonth: DashboardRevenueByMethod[];
  result: { revenue: number; cogs: number; expenses: number; profit: number };
  target: { monthly: number | null; progress: number | null };
}

export type {
  OpenRegisterInput,
  CloseRegisterInput,
  CashMovementInput,
  PayableInput,
  SettleReceivableInput,
  ManualEntryInput,
  FinancialCategoryInput,
} from '@beverage/shared';
