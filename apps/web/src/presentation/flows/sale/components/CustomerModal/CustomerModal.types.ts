import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Customer } from '@/domain/models/sale';
import type { CustomerFormInput } from './CustomerModal.schema';

export type CustomerModalProps = {
  onPick: (customer: Customer) => void;
  onClose: () => void;
};

// Filtro de busca — form RHF sem validação (só lê o valor via watch).
export type CustomerFilterInput = {
  search: string;
};

export type CustomerRow = {
  key: string;
  onClick: () => void;
  cells: [string, string];
};

export type CustomerModalViewProps = {
  registerFilter: UseFormRegister<CustomerFilterInput>;
  rows: CustomerRow[];
  register: UseFormRegister<CustomerFormInput>;
  onSubmit: ReturnType<UseFormHandleSubmit<CustomerFormInput>>;
  canCreate: boolean;
  onClose: () => void;
};
