import { z } from 'zod';
import {
  CashMovementType,
  FinancialCategoryKind,
  PaymentMethod,
  StockPolicy,
} from './enums';

/** Valor monetário em reais com até 2 casas (nunca float arbitrário). */
export const money = z
  .number()
  .min(0)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
    message: 'Valor monetário deve ter no máximo 2 casas decimais',
  });

export const quantity = z.number().int().positive();

// ---------- Auth ----------
export const loginSchema = z.object({
  login: z.string().min(1, 'Informe o login'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Usuários / papéis ----------
export const createUserSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  login: z.string().min(3, 'Login deve ter ao menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  roleId: z.string().min(1, 'Selecione o papel'),
  active: z.boolean().default(true),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(6).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const roleSchema = z.object({
  name: z.string().min(1, 'Informe o nome do papel'),
  permissions: z.array(z.string()).min(1, 'Selecione ao menos uma permissão'),
});
export type RoleInput = z.infer<typeof roleSchema>;

// ---------- Produtos (FR-01) ----------
export const productSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  sku: z.string().min(1, 'Informe o SKU'),
  ean: z.string().regex(/^\d{8,14}$/, 'EAN deve ter de 8 a 14 dígitos').optional().or(z.literal('')),
  unit: z.string().min(1, 'Informe a unidade (ex.: un, cx, L)'),
  purchasePrice: money,
  salePrice: money,
  minimumStock: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;
export const updateProductSchema = productSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ---------- Estoque (FR-05/FR-08) ----------
export const stockEntrySchema = z.object({
  productId: z.string().min(1),
  quantity,
  unitCost: money.optional(),
  batch: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
  note: z.string().optional(),
});
export type StockEntryInput = z.infer<typeof stockEntrySchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  /** Positivo aumenta, negativo reduz. */
  quantity: z.number().int().refine((v) => v !== 0, 'Quantidade não pode ser zero'),
  reason: z.string().min(3, 'Informe o motivo do ajuste'),
});
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// ---------- Clientes (FR-25) ----------
export const customerSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  contact: z.string().optional(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

// ---------- Vendas / PDV ----------
export const addSaleItemSchema = z.object({
  /** EAN, SKU ou id do produto — o backend resolve (FR-10/FR-11). */
  code: z.string().min(1),
  quantity: quantity.default(1),
});
export type AddSaleItemInput = z.infer<typeof addSaleItemSchema>;

export const updateSaleItemSchema = z.object({
  quantity,
});
export type UpdateSaleItemInput = z.infer<typeof updateSaleItemSchema>;

export const discountSchema = z
  .object({
    type: z.enum(['AMOUNT', 'PERCENT']),
    value: z.number().min(0),
  })
  .refine((d) => d.type !== 'PERCENT' || d.value <= 100, {
    message: 'Percentual máximo é 100%',
  });
export type DiscountInput = z.infer<typeof discountSchema>;

export const completeSaleSchema = z
  .object({
    paymentMethod: z.enum(PaymentMethod),
    /** Obrigatório para pagamento em dinheiro (FR-18). */
    amountPaid: money.optional(),
    withInvoice: z.boolean().default(false),
    /** Obrigatório para venda a prazo (BR-08). */
    customerId: z.string().optional(),
    dueDate: z.coerce.date().optional(),
  })
  .refine((s) => s.paymentMethod !== PaymentMethod.CREDIT || !!s.customerId, {
    message: 'Venda a prazo exige cliente',
    path: ['customerId'],
  });
export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;

// ---------- Caixa (FR-27) ----------
export const openRegisterSchema = z.object({
  openingBalance: money,
});
export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;

export const closeRegisterSchema = z.object({
  /** Saldo contado pelo operador — conferido contra o calculado (BR-06). */
  countedBalance: money,
  note: z.string().optional(),
});
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;

export const cashMovementSchema = z.object({
  type: z.enum(CashMovementType),
  amount: money.refine((v) => v > 0, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Informe a descrição'),
  categoryId: z.string().optional(),
});
export type CashMovementInput = z.infer<typeof cashMovementSchema>;

// ---------- Financeiro ----------
export const financialCategorySchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  kind: z.enum(FinancialCategoryKind),
});
export type FinancialCategoryInput = z.infer<typeof financialCategorySchema>;

export const payableSchema = z.object({
  description: z.string().min(1, 'Informe a descrição'),
  supplier: z.string().optional(),
  amount: money.refine((v) => v > 0, 'Valor deve ser maior que zero'),
  dueDate: z.coerce.date(),
  categoryId: z.string().optional(),
});
export type PayableInput = z.infer<typeof payableSchema>;

export const manualEntrySchema = z.object({
  kind: z.enum(FinancialCategoryKind),
  amount: money.refine((v) => v > 0, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Informe a descrição'),
  categoryId: z.string().optional(),
  date: z.coerce.date().optional(),
});
export type ManualEntryInput = z.infer<typeof manualEntrySchema>;

export const settleReceivableSchema = z.object({
  /** Como o fiado foi recebido — vira entrada no fluxo de caixa (BR-08). */
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD]),
});
export type SettleReceivableInput = z.infer<typeof settleReceivableSchema>;

// ---------- Configurações (NFR-10) ----------
export const settingsSchema = z.object({
  stockPolicy: z.enum(StockPolicy).optional(),
  revenueTargetMonthly: money.optional(),
  enabledPaymentMethods: z.array(z.enum(PaymentMethod)).min(1).optional(),
  defaultMinimumStock: z.number().int().min(0).optional(),
  expiryAlertDays: z.number().int().min(1).optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
