import { useState } from 'react';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { parseMoney } from '@/lib/format';
import { useCreateFinancialEntryMutation } from '@/main/factories/mutations/financial';
import { useFinancialCategoriesQuery } from '@/main/factories/queries/financial';
import type { ManualEntryKind } from './ManualEntryModal.types';

export function useManualEntryModalModel(onDone: () => void) {
  const toast = useToast();
  const [kind, setKind] = useState<ManualEntryKind>('EXPENSE');
  const [raw, setRaw] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: allCategories = [] } = useFinancialCategoriesQuery();
  const categories = allCategories.filter((c) => c.kind === kind);

  const amount = parseMoney(raw);
  const valid = Number.isFinite(amount) && amount > 0 && description.trim().length > 0;

  const save = useCreateFinancialEntryMutation();

  const submit = () => {
    save.mutate(
      { kind, amount, description, categoryId: categoryId || undefined },
      {
        onSuccess: onDone,
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return {
    kind,
    setKind,
    raw,
    setRaw,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    categories,
    valid,
    saving: save.isPending,
    submit,
  };
}
