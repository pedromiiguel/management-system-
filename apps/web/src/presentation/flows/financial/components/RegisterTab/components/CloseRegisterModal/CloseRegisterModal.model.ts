import { useState } from 'react';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { formatBRL, parseMoney } from '@/lib/format';
import { useCloseCashRegisterMutation } from '@/main/factories/mutations/financial';

export function useCloseRegisterModalModel(expected: number, onDone: () => void) {
  const toast = useToast();
  const [raw, setRaw] = useState('');
  const counted = parseMoney(raw);
  const valid = Number.isFinite(counted) && counted >= 0;
  const difference = valid ? counted - expected : null;

  const close = useCloseCashRegisterMutation();

  const submit = () => {
    close.mutate(
      { countedBalance: counted },
      {
        onSuccess: (closed) => {
          const diff = Number(closed.difference);
          toast(
            diff === 0
              ? 'Caixa fechado — diferença zero ✓'
              : `Caixa fechado — ${diff > 0 ? 'sobra' : 'falta'} de ${formatBRL(Math.abs(diff))}`,
            diff === 0 ? 'info' : 'warn',
          );
          onDone();
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return { raw, setRaw, valid, difference, saving: close.isPending, submit };
}
