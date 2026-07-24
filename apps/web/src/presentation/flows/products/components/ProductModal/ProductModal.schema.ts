import { z } from 'zod';
import { productSchema, type ProductInput } from '@beverage/shared';

// Entrada embutida no cadastro/edição (ADR 0001): quantidade opcional — só vira
// StockMovement se preenchida. Sem campo de custo próprio: usa o purchasePrice
// já informado no formulário.
export const productFormSchema = productSchema
  .extend({
    stockEntry: z
      .object({
        quantity: z.number().int().min(1).optional(),
        batch: z.string().optional(),
        expiresAt: z.coerce.date().optional(),
      })
      .optional(),
  })
  .transform(({ stockEntry, ...rest }): ProductInput => ({
    ...rest,
    ...(stockEntry?.quantity
      ? {
          stockEntry: {
            quantity: stockEntry.quantity,
            batch: stockEntry.batch,
            expiresAt: stockEntry.expiresAt,
          },
        }
      : {}),
  }));

export type ProductFormInput = z.input<typeof productFormSchema>;
