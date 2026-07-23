import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { DiscountInput } from '@/domain/models/sale';
import { parseMoney } from '@/lib/format';
import { discountFormSchema, type DiscountFormInput } from './DiscountModal.schema';
import type { DiscountType } from './DiscountModal.types';

export function useDiscountModalModel(onApply: (discount: DiscountInput | null) => void) {
  const { register, handleSubmit, watch, setValue, formState } = useForm<DiscountFormInput>({
    resolver: zodResolver(discountFormSchema),
    mode: 'onChange',
    defaultValues: { type: 'AMOUNT', raw: '' },
  });

  const selectedType = watch('type');

  const submit = handleSubmit(({ type, raw }) => {
    onApply({ type, value: parseMoney(raw) });
  });

  // Chips não expõem ref (controlled fallback): valor via watch + setValue.
  const selectType = (type: DiscountType) => {
    setValue('type', type, { shouldValidate: true });
  };

  return {
    register,
    selectedType,
    selectType,
    submit,
    canApply: formState.isValid,
    removeDiscount: () => onApply(null),
  };
}
