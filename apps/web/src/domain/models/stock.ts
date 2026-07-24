/** Domínio `stock` — criado na ADR 0007 para `StockAlerts`, completo na ADR 0008. */
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

export type MovementType = 'ENTRY' | 'EXIT';
export type MovementSource = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'CANCELLATION';

export interface StockMovement {
  id: string;
  type: MovementType;
  source: MovementSource;
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string; unit: string };
}

export type { StockEntryInput, StockAdjustmentInput } from '@beverage/shared';
