import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { usePayPayableMutation } from '@/main/factories/mutations/financial';
import { usePayablesQuery } from '@/main/factories/queries/financial';

export function usePayablesTabModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data: payables = [] } = usePayablesQuery();
  const payMutation = usePayPayableMutation();

  const pay = (id: string) => {
    payMutation.mutate(id, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['payables'] });
        void queryClient.invalidateQueries({ queryKey: ['financial'] });
        toast('Conta paga — saída registrada no fluxo');
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  };

  const onCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['payables'] });
    setCreating(false);
  };

  return { payables, creating, setCreating, pay, onCreated };
}
