import { useAdjustModalModel } from './AdjustModal.model';
import { AdjustModalView } from './AdjustModal.view';
import type { AdjustModalProps, ProductPickRow } from './AdjustModal.types';

export function AdjustModal({ onSaved, onClose }: AdjustModalProps) {
  const {
    picked,
    pick,
    unpick,
    registerFilter,
    results,
    showResults,
    register,
    errors,
    submit,
    saving,
    canSubmit,
  } = useAdjustModalModel(onSaved);

  const rows: ProductPickRow[] = results.map((p) => ({
    key: p.id,
    onClick: () => pick(p),
    cells: [p.name, p.currentStock],
  }));

  return (
    <AdjustModalView
      picked={picked}
      onUnpick={unpick}
      registerFilter={registerFilter}
      showResults={showResults}
      rows={rows}
      register={register}
      errors={errors}
      onSubmit={submit}
      saving={saving}
      canSubmit={canSubmit}
      onClose={onClose}
    />
  );
}
