import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { DiscountInput } from '@/domain/models/sale';
import type { DiscountFormInput } from './DiscountModal.schema';

export type DiscountType = DiscountInput['type'];

export type DiscountModalProps = {
  onSubmit: (discount: DiscountInput | null) => void;
  onClose: () => void;
};

export type DiscountModalViewProps = {
  register: UseFormRegister<DiscountFormInput>;
  selectedType: DiscountType;
  onSelectType: (type: DiscountType) => void;
  placeholder: string;
  onSubmit: ReturnType<UseFormHandleSubmit<DiscountFormInput>>;
  canApply: boolean;
  onRemove: () => void;
  onClose: () => void;
};
