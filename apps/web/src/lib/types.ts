import type { PaymentMethod } from '@beverage/shared';

// Product, Sale, SaleItem e Customer são definidos em @/domain/models/sale —
// única fonte da verdade (ADR 0003/0004). Reexportados aqui só porque
// products.tsx, reports.tsx e stock.tsx ainda importam deste arquivo e estão
// fora do escopo do piloto de Clean Architecture.
export type { Product, Sale, SaleItem, Customer } from '@/domain/models/sale';

// CashMovement, CashRegister, Receivable, Payable, FinancialCategory e
// Dashboard são definidos em @/domain/models/financial — única fonte da
// verdade (ADR 0006). Reexportados aqui pela mesma razão acima.
export type {
  CashMovement,
  CashRegister,
  Receivable,
  Payable,
  FinancialCategory,
  Dashboard,
} from '@/domain/models/financial';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
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
