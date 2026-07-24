import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import type { Product } from '@/domain/models/products';
import { useCreateStockEntryMutation } from '@/main/factories/mutations/products';
import { useProductSearchQuery } from '@/main/factories/queries/products';
import {
  stockEntryFormSchema,
  type StockEntryFormInput,
  type StockEntryFormOutput,
} from './StockEntryModal.schema';
import type { StockEntryFilterInput } from './StockEntryModal.types';

export function useStockEntryModalModel(initialProduct: Product | undefined, onSaved: () => void) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<Product | null>(initialProduct ?? null);

  // Filtro de busca — RHF uncontrolled + watch, mesmo padrão do CustomerModal
  // (componentes-mvvm.md). Sem schema/validação: é só um filtro.
  const { register: registerFilter, watch } = useForm<StockEntryFilterInput>({
    defaultValues: { search: '' },
  });
  const search = watch('search');

  const { data } = useProductSearchQuery(search, !picked && search.length >= 2);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockEntryFormInput, unknown, StockEntryFormOutput>({
    resolver: zodResolver(stockEntryFormSchema),
    defaultValues: { quantity: 1 },
  });

  const createStockEntry = useCreateStockEntryMutation();

  const submit = handleSubmit((input) => {
    if (!picked) return;
    createStockEntry.mutate(
      { ...input, productId: picked.id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['products'] });
          void queryClient.invalidateQueries({ queryKey: ['stock'] });
          toast('Entrada registrada');
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
    saving: createStockEntry.isPending,
  };
}
