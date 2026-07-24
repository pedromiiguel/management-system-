import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { useOpenCashRegisterMutation } from '@/main/factories/mutations/financial';
import { useCashRegisterHistoryQuery, useCurrentCashRegisterQuery } from '@/main/factories/queries/financial';
import type { RegisterModal } from './RegisterTab.types';

export function useRegisterTabModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<RegisterModal>('none');

  const { data: register } = useCurrentCashRegisterQuery();
  const { data: history = [] } = useCashRegisterHistoryQuery();
  const openRegisterMutation = useOpenCashRegisterMutation();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    void queryClient.invalidateQueries({ queryKey: ['financial'] });
  };

  const onDone = () => {
    invalidate();
    setModal('none');
  };

  const openRegister = (openingBalance: number) => {
    openRegisterMutation.mutate(
      { openingBalance },
      {
        onSuccess: () => {
          toast('Caixa aberto');
          onDone();
        },
        onError: (error) => toast(apiErrorMessage(error), 'danger'),
      },
    );
  };

  return { register, history, modal, setModal, onDone, openRegister };
}
