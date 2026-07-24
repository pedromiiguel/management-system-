import { useManualEntryModalModel } from './ManualEntryModal.model';
import { ManualEntryModalView } from './ManualEntryModal.view';
import type { ManualEntryModalProps } from './ManualEntryModal.types';

export function ManualEntryModal({ onDone, onClose }: ManualEntryModalProps) {
  const {
    kind,
    setKind,
    raw,
    setRaw,
    description,
    setDescription,
    categoryId,
    setCategoryId,
    categories,
    valid,
    saving,
    submit,
  } = useManualEntryModalModel(onDone);

  return (
    <ManualEntryModalView
      kind={kind}
      raw={raw}
      description={description}
      categoryId={categoryId}
      categories={categories}
      valid={valid}
      saving={saving}
      onChangeKind={setKind}
      onChangeRaw={setRaw}
      onChangeDescription={setDescription}
      onChangeCategoryId={setCategoryId}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
