import { useDiscountModalModel } from './DiscountModal.model';
import { DiscountModalView } from './DiscountModal.view';
import type { DiscountModalProps } from './DiscountModal.types';

export function DiscountModal({ onSubmit, onClose }: DiscountModalProps) {
  const { register, selectedType, selectType, submit, canApply, removeDiscount } =
    useDiscountModalModel(onSubmit);

  const placeholder = selectedType === 'AMOUNT' ? '0,00' : '0';

  return (
    <DiscountModalView
      register={register}
      selectedType={selectedType}
      onSelectType={selectType}
      placeholder={placeholder}
      onSubmit={submit}
      canApply={canApply}
      onRemove={removeDiscount}
      onClose={onClose}
    />
  );
}
