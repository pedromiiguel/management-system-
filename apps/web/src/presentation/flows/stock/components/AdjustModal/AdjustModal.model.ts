import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import type { Product } from '@/domain/models/products';
import { useCreateStockAdjustmentMutation } from '@/main/factories/mutations/stock';
import { useProductSearchQuery } from '@/main/factories/queries/products';
import {
  adjustmentFormSchema,
  type AdjustmentFormInput,
  type AdjustmentFormOutput,
} from './AdjustModal.schema';
import type { AdjustFilterInput } from './AdjustModal.types';

export function useAdjustModalModel(onSaved: () => void) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<Product | null>(null);

  const { register: registerFilter, watch } = useForm<AdjustFilterInput>({
    defaultValues: { search: '' },
  });
  const search = watch('search');

  const { data } = useProductSearchQuery(search, !picked && search.length >= 2);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AdjustmentFormInput, unknown, AdjustmentFormOutput>({
    resolver: zodResolver(adjustmentFormSchema),
    mode: 'onChange',
  });

  const createAdjustment = useCreateStockAdjustmentMutation();

  const submit = handleSubmit((input) => {
    if (!picked) return;
    createAdjustment.mutate(
      { ...input, productId: picked.id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['products'] });
          void queryClient.invalidateQueries({ queryKey: ['stock'] });
          toast('Ajuste registrado');
          onSaved();
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  });

  return {
    picked,
    pick: setPicked,
    unpick: () => setPicked(null),
    registerFilter,
    results: data?.items ?? [],
    showResults: search.length >= 2,
    register,
    errors,
    submit,
    saving: createAdjustment.isPending,
    canSubmit: Boolean(picked) && isValid,
  };
}
