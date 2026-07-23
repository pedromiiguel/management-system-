import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe ao menos 2 caracteres'),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
