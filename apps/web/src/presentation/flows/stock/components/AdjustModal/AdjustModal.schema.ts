import { z } from 'zod';
import { stockAdjustmentSchema } from '@beverage/shared';

export const adjustmentFormSchema = stockAdjustmentSchema.omit({ productId: true });
export type AdjustmentFormInput = z.input<typeof adjustmentFormSchema>;
export type AdjustmentFormOutput = z.output<typeof adjustmentFormSchema>;
