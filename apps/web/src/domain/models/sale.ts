import type { PaymentMethod, SaleStatus } from '@beverage/shared';

export interface Product {
  id: string;
  sku: string;
  ean: string | null;
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
}

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
