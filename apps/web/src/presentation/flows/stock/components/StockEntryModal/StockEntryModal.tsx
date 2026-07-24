import { useStockEntryModalModel } from './StockEntryModal.model';
import { StockEntryModalView } from './StockEntryModal.view';
import type { ProductPickRow, StockEntryModalProps } from './StockEntryModal.types';

export function StockEntryModal({ product, onSaved, onClose }: StockEntryModalProps) {
  const { picked, pick, unpick, registerFilter, results, showResults, register, errors, submit, saving } =
    useStockEntryModalModel(product, onSaved);

  const rows: ProductPickRow[] = results.map((p) => ({
    key: p.id,
    onClick: () => pick(p),
    cells: [p.name, p.currentStock],
  }));

  return (
    <StockEntryModalView
      picked={picked}
      onUnpick={unpick}
      registerFilter={registerFilter}
      showResults={showResults}
      rows={rows}
      register={register}
      errors={errors}
      onSubmit={submit}
      saving={saving}
      onClose={onClose}
    />
  );
}
