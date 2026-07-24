import type { PaymentMethod, SaleStatus } from '@beverage/shared';

// Product é definido em @/domain/models/products (ADR 0007) — pertence
// conceitualmente a esse domínio, não a sale. Reexportado aqui porque sale
// precisa dele para montar SaleItemProduct, e vários arquivos deste flow já
// importam Product a partir daqui (import não quebra).
import type { Product } from '@/domain/models/products';
export type { Product };

export interface Customer {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  openBalance: number;
}

export type SaleItemProduct = Pick<Product, 'name' | 'sku' | 'ean' | 'unit'>;

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  product: SaleItemProduct;
}

export type SaleCustomer = Pick<Customer, 'id' | 'name'> | null;

export type SaleOperator = { id: string; name: string };

export interface Sale {
  id: string;
  status: SaleStatus;
  subtotal: number;
  total: number;
  discountType: 'AMOUNT' | 'PERCENT' | null;
  discountValue: number | null;
  paymentMethod: PaymentMethod | null;
  amountPaid: number | null;
  change: number | null;
  serviceFee: number | null;
  withInvoice: boolean;
  openedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  items: SaleItem[];
  customer: SaleCustomer;
  operator: SaleOperator;
}

export type { UpdateSaleItemInput, DiscountInput, CompleteSaleInput } from '@beverage/shared';

/**
 * Não reaproveita o `AddSaleItemInput` inferido de `addSaleItemSchema`
 * (`@beverage/shared`) porque lá `quantity` tem `.default(1)` — o zod infere
 * o tipo de *saída* (pós-default), tornando `quantity` obrigatório. No PDV
 * quem chama decide se envia `quantity` ou deixa o backend aplicar o default.
 */
export type AddSaleItemInput = { code: string; quantity?: number };
