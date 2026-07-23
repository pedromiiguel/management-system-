import { formatBRL } from '@/lib/format';
import { useCustomerModalModel } from './CustomerModal.model';
import { CustomerModalView } from './CustomerModal.view';
import type { CustomerModalProps, CustomerRow } from './CustomerModal.types';

export function CustomerModal({ onPick, onClose }: CustomerModalProps) {
  const { registerFilter, customers, register, submit, canCreate } =
    useCustomerModalModel(onPick);

  const rows: CustomerRow[] = customers.map((customer) => ({
    key: customer.id,
    onClick: () => onPick(customer),
    cells: [customer.name, formatBRL(customer.openBalance)],
  }));

  return (
    <CustomerModalView
      registerFilter={registerFilter}
      rows={rows}
      register={register}
      onSubmit={submit}
      canCreate={canCreate}
      onClose={onClose}
    />
  );
}
