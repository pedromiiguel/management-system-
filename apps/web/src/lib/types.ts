import type { PaymentMethod } from '@beverage/shared';

// Sale, SaleItem e Customer são definidos em @/domain/models/sale — única
// fonte da verdade (ADR 0003/0004). Reexportados aqui só porque reports.tsx
// ainda importa deste arquivo e está fora do escopo das migrações atuais.
export type { Sale, SaleItem, Customer } from '@/domain/models/sale';

// Product é definido em @/domain/models/products (ADR 0007). Reexportado
// aqui pela mesma razão acima — stock.tsx e reports.tsx ainda importam Product
// deste arquivo.
export type { Product } from '@/domain/models/products';

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

// Paginated é definido em @/domain/models/products (ADR 0007) — genérico o
// bastante para ter nascido lá por ser o primeiro domínio a precisar dele.
// Reexportado aqui porque reports.tsx e stock.tsx ainda usam este tipo.
export type { Paginated } from '@/domain/models/products';

// StockAlerts é definido em @/domain/models/stock (ADR 0007). Reexportado
// aqui porque stock.tsx ainda importa deste arquivo.
export type { StockAlerts } from '@/domain/models/stock';

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
