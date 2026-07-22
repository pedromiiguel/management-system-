import type { CashMovementType, CashRegisterStatus, PaymentMethod } from '@beverage/shared';

// Product, Sale, SaleItem e Customer são definidos em @/domain/models/sale —
// única fonte da verdade (ADR 0003/0004). Reexportados aqui só porque
// financial.tsx, products.tsx, reports.tsx e stock.tsx ainda importam deste
// arquivo e estão fora do escopo do piloto de Clean Architecture.
export type { Product, Sale, SaleItem, Customer } from '@/domain/models/sale';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod | null;
  occurredAt: string;
  category?: { id: string; name: string } | null;
  sale?: { id: string } | null;
}

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
  operator: { id: string; name: string };
  movements?: CashMovement[];
  summary?: {
    inflowsByMethod: Record<string, number>;
    pulls: number;
    floats: number;
    outflows: number;
    expectedCash: number;
  };
}

export interface Receivable {
  id: string;
  amount: number;
  dueDate: string | null;
  status: 'OPEN' | 'RECEIVED';
  receivedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; contact: string | null };
  sale: { id: string; completedAt: string | null; total: number } | null;
}

export interface Payable {
  id: string;
  description: string;
  supplier: string | null;
  amount: number;
  dueDate: string;
  status: 'OPEN' | 'PAID';
  paidAt: string | null;
  category: { id: string; name: string } | null;
}

export interface FinancialCategory {
  id: string;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  system: boolean;
}

export interface Dashboard {
  revenue: { day: number; month: number; year: number };
  byMethodMonth: { paymentMethod: PaymentMethod; total: number; count: number }[];
  result: { revenue: number; cogs: number; expenses: number; profit: number };
  target: { monthly: number | null; progress: number | null };
}

export interface StockAlerts {
  lowStock: { id: string; name: string; sku: string; currentStock: number; minimumStock: number }[];
  expiring: {
    id: string;
    batch: string | null;
    expiresAt: string | null;
    quantity: number;
    product: { id: string; name: string; sku: string };
  }[];
}

export interface AppSettings {
  stockPolicy: 'BLOCK' | 'WARN';
  revenueTargetMonthly: number | null;
  enabledPaymentMethods: PaymentMethod[];
  defaultMinimumStock: number;
  expiryAlertDays: number;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  system: boolean;
}

export interface UserRow {
  id: string;
  name: string;
  login: string;
  active: boolean;
  roleId: string;
  role: { id: string; name: string };
}
