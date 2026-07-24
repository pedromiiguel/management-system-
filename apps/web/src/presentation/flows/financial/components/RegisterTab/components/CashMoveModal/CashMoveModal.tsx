import { CashMovementType } from '@beverage/shared';
import { useCashMoveModalModel } from './CashMoveModal.model';
import { CashMoveModalView } from './CashMoveModal.view';
import type { CashMoveModalProps } from './CashMoveModal.types';

export function CashMoveModal({ onDone, onClose }: CashMoveModalProps) {
  const { type, setType, raw, setRaw, description, setDescription, valid, saving, submit } =
    useCashMoveModalModel(onDone);

  const descriptionPlaceholder =
    type === CashMovementType.PULL ? 'ex.: depósito no banco' : 'ex.: reforço de troco';

  return (
    <CashMoveModalView
      type={type}
      raw={raw}
      description={description}
      descriptionPlaceholder={descriptionPlaceholder}
      valid={valid}
      saving={saving}
      onChangeType={setType}
      onChangeRaw={setRaw}
      onChangeDescription={setDescription}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
