import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import type { Receivable, SettleReceivableInput } from '@/domain/models/financial';
import { useSettleReceivableMutation } from '@/main/factories/mutations/financial';
import { useReceivablesQuery } from '@/main/factories/queries/financial';

export function useReceivablesTabModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settling, setSettling] = useState<Receivable | null>(null);

  const { data: receivables = [] } = useReceivablesQuery();
  const settleMutation = useSettleReceivableMutation();

  const settle = (method: SettleReceivableInput['paymentMethod']) => {
    if (!settling) return;
    settleMutation.mutate(
      { id: settling.id, input: { paymentMethod: method } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['receivables'] });
          void queryClient.invalidateQueries({ queryKey: ['cash-register'] });
          toast('Recebimento registrado');
          setSettling(null);
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return { receivables, settling, setSettling, settle };
}
