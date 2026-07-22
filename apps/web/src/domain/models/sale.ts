export type { Product, Sale, SaleItem, Customer } from '@/lib/types';
export type { UpdateSaleItemInput, DiscountInput, CompleteSaleInput } from '@beverage/shared';

/**
 * Não reaproveita o `AddSaleItemInput` inferido de `addSaleItemSchema`
 * (`@beverage/shared`) porque lá `quantity` tem `.default(1)` — o zod infere
 * o tipo de *saída* (pós-default), tornando `quantity` obrigatório. No PDV
 * quem chama decide se envia `quantity` ou deixa o backend aplicar o default.
 */
export type AddSaleItemInput = { code: string; quantity?: number };
