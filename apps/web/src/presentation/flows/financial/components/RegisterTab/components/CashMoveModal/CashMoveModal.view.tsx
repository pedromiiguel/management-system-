import { CASH_MOVEMENT_LABELS, CashMovementType } from '@beverage/shared';
import { SBtn, SChip, SModal } from '@/components/sol';
import type { CashMoveModalViewProps } from './CashMoveModal.types';

const MOVEMENT_TYPES = [CashMovementType.PULL, CashMovementType.FLOAT, CashMovementType.OUTFLOW] as const;

export function CashMoveModalView({
  type,
  raw,
  description,
  descriptionPlaceholder,
  valid,
  saving,
  onChangeType,
  onChangeRaw,
  onChangeDescription,
  onSubmit,
  onClose,
}: CashMoveModalViewProps) {
  return (
    <SModal title="Movimento de caixa" onClose={onClose} width={420}>
      <div className="flex gap-2 mb-3">
        {MOVEMENT_TYPES.map((t) => (
          <SChip key={t} active={type === t} onClick={() => onChangeType(t)}>
            {CASH_MOVEMENT_LABELS[t]}
          </SChip>
        ))}
      </div>
      <div className="s-label">Valor (R$)</div>
      <div className="s-input mb-2.5">
        <input
          autoFocus
          data-testid="cash-move-amount"
          value={raw}
          onChange={(e) => onChangeRaw(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <div className="s-label">Descrição</div>
      <div className="s-input">
        <input
          data-testid="cash-move-description"
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder={descriptionPlaceholder}
        />
      </div>
      <div className="flex gap-2 justify-end mt-3.5">
        <SBtn ghost onClick={onClose}>Voltar</SBtn>
        <SBtn primary disabled={!valid || saving} onClick={onSubmit}>Registrar</SBtn>
      </div>
    </SModal>
  );
}
