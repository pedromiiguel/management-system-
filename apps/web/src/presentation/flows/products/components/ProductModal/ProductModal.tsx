import { useProductModalModel } from './ProductModal.model';
import { ProductModalView } from './ProductModal.view';
import type { ProductModalProps } from './ProductModal.types';

export function ProductModal({ product, onSaved, onClose }: ProductModalProps) {
  const { register, errors, submit, saving, canEnterStock, deactivate } = useProductModalModel(
    product,
    onSaved,
  );

  return (
    <ProductModalView
      product={product}
      register={register}
      errors={errors}
      onSubmit={submit}
      saving={saving}
      canEnterStock={canEnterStock}
      onDeactivate={deactivate}
      onClose={onClose}
    />
  );
}
