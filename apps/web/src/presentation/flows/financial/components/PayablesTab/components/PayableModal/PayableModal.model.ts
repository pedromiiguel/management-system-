import { useState } from 'react';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { parseMoney, toDateInput } from '@/lib/format';
import { useCreatePayableMutation } from '@/main/factories/mutations/financial';
import { useFinancialCategoriesQuery } from '@/main/factories/queries/financial';

export function usePayableModalModel(onDone: () => void) {
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [raw, setRaw] = useState('');
  const [dueDate, setDueDate] = useState(toDateInput(new Date()));
  const [categoryId, setCategoryId] = useState('');

  const { data: allCategories = [] } = useFinancialCategoriesQuery();
  const categories = allCategories.filter((c) => c.kind === 'EXPENSE');

  const amount = parseMoney(raw);
  const valid = description.trim().length > 0 && Number.isFinite(amount) && amount > 0 && dueDate.length > 0;

  const save = useCreatePayableMutation();

  const submit = () => {
    save.mutate(
      {
        description,
        supplier: supplier || undefined,
        amount,
        dueDate: new Date(dueDate),
        categoryId: categoryId || undefined,
      },
      {
        onSuccess: () => {
          toast('Conta registrada');
          onDone();
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return {
    description,
    setDescription,
    supplier,
    setSupplier,
    raw,
    setRaw,
    dueDate,
    setDueDate,
    categoryId,
    setCategoryId,
    categories,
    valid,
    saving: save.isPending,
    submit,
  };
}
