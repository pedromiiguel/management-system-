import { z } from 'zod';
import { stockEntrySchema } from '@beverage/shared';

export const stockEntryFormSchema = stockEntrySchema.omit({ productId: true });
export type StockEntryFormInput = z.input<typeof stockEntryFormSchema>;
export type StockEntryFormOutput = z.output<typeof stockEntryFormSchema>;
