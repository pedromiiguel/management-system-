import { z } from 'zod';
import { parseMoney } from '@/lib/format';

export const discountFormSchema = z
  .object({
    type: z.enum(['AMOUNT', 'PERCENT']),
    raw: z.string(),
  })
  .refine(
    ({ type, raw }) => {
      const value = parseMoney(raw);
      return Number.isFinite(value) && value >= 0 && (type !== 'PERCENT' || value <= 100);
    },
    { path: ['raw'], message: 'Valor inválido' },
  );

export type DiscountFormInput = z.infer<typeof discountFormSchema>;
