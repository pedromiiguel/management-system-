import { useState } from 'react';
import { CashMovementType } from '@beverage/shared';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { parseMoney } from '@/lib/format';
import { useCreateCashMovementMutation } from '@/main/factories/mutations/financial';

export function useCashMoveModalModel(onDone: () => void) {
  const toast = useToast();
  const [type, setType] = useState<CashMovementType>(CashMovementType.PULL);
  const [raw, setRaw] = useState('');
  const [description, setDescription] = useState('');
  const value = parseMoney(raw);
  const valid = Number.isFinite(value) && value > 0 && description.trim().length > 0;

  const save = useCreateCashMovementMutation();

  const submit = () => {
    save.mutate(
      { type, amount: value, description },
      {
        onSuccess: () => {
          toast(type === CashMovementType.PULL ? 'Sangria registrada' : 'Movimento registrado');
          onDone();
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return {
    type,
    setType,
    raw,
    setRaw,
    description,
    setDescription,
    valid,
    saving: save.isPending,
    submit,
  };
}
