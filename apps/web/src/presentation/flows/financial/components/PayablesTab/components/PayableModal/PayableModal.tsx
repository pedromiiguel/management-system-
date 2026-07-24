import { usePayableModalModel } from './PayableModal.model';
import { PayableModalView } from './PayableModal.view';
import type { PayableModalProps } from './PayableModal.types';

export function PayableModal({ onDone, onClose }: PayableModalProps) {
  const {
    description,
    setDescription,
    supplier,
    setSupplier,
    raw,
    setRaw,
    dueDate,
    setDueDate,
    categoryId,
    setCategoryId,
    categories,
    valid,
    saving,
    submit,
  } = usePayableModalModel(onDone);

  return (
    <PayableModalView
      description={description}
      supplier={supplier}
      raw={raw}
      dueDate={dueDate}
      categoryId={categoryId}
      categories={categories}
      valid={valid}
      saving={saving}
      onChangeDescription={setDescription}
      onChangeSupplier={setSupplier}
      onChangeRaw={setRaw}
      onChangeDueDate={setDueDate}
      onChangeCategoryId={setCategoryId}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
