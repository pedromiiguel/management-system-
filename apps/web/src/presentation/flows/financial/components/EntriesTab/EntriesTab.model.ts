import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/sol';
import { toDateInput } from '@/lib/format';
import { useCashFlowQuery } from '@/main/factories/queries/financial';

export function useEntriesTabModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [from, setFrom] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(toDateInput(now));
  const [creating, setCreating] = useState(false);

  const { data } = useCashFlowQuery(from, `${to}T23:59:59`);

  const onCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['financial'] });
    setCreating(false);
    toast('Lançamento registrado');
  };

  return {
    from,
    setFrom,
    to,
    setTo,
    data,
    creating,
    setCreating,
    onCreated,
  };
}
