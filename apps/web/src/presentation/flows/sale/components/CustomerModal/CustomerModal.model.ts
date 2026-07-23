import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Customer } from '@/domain/models/sale';
import { useCreateCustomerMutation } from '@/main/factories/mutations/sale';
import { useSearchCustomersQuery } from '@/main/factories/queries/sale';
import { useToast } from '@/components/sol';
import { useDebounce } from '@/presentation/hooks';
import { apiErrorMessage } from '@/lib/api';
import { customerFormSchema, type CustomerFormInput } from './CustomerModal.schema';
import type { CustomerFilterInput } from './CustomerModal.types';

const SEARCH_DEBOUNCE_MS = 300;

export function useCustomerModalModel(onPick: (customer: Customer) => void) {
  const toast = useToast();

  const { register: registerFilter, watch } = useForm<CustomerFilterInput>({
    defaultValues: { search: '' },
  });
  const search = watch('search');
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const { data: customers = [], refetch } = useSearchCustomersQuery(debouncedSearch);

  const createCustomer = useCreateCustomerMutation();


  const { register, handleSubmit, reset, formState } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    mode: 'onChange',
  });

  const submit = handleSubmit(({ name }) => {
    createCustomer.mutate(name, {
      onSuccess: (created) => {
        void refetch();
        reset();
        onPick({ ...created, openBalance: 0 });
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  });

  return { registerFilter, customers, register, submit, canCreate: formState.isValid };
}
