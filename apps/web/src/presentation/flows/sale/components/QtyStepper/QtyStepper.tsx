import { useQtyStepperModel } from './QtyStepper.model';
import { QtyStepperView } from './QtyStepper.view';
import type { QtyStepperProps } from './QtyStepper.types';

// Alterar quantidade de um item já na venda (FR-14) — +/- ou digitação direta,
// sem precisar rebipar o produto. Ver CONTEXT.md ("Alterar quantidade").
export function QtyStepper({ quantity, onStep, onTyped, onDone }: QtyStepperProps) {
  const { raw, changeRaw, commitTyped } = useQtyStepperModel(quantity, onTyped);

  return (
    <QtyStepperView
      raw={raw}
      canDecrement={quantity > 1}
      onDecrement={() => onStep(-1)}
      onIncrement={() => onStep(1)}
      onChangeRaw={changeRaw}
      onCommit={() => {
        commitTyped();
        onDone();
      }}
    />
  );
}
