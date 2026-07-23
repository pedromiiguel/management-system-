import { SBtn, SChip, SModal } from '@/components/sol';
import type { DiscountModalViewProps } from './DiscountModal.types';

export function DiscountModalView({
  register,
  selectedType,
  onSelectType,
  placeholder,
  onSubmit,
  canApply,
  onRemove,
  onClose,
}: DiscountModalViewProps) {
  return (
    <SModal title="Desconto na venda (F4)" onClose={onClose} width={380}>
      <form onSubmit={onSubmit}>
        <div className="flex gap-2 mb-2.5">
          <SChip active={selectedType === 'AMOUNT'} onClick={() => onSelectType('AMOUNT')}>
            Valor (R$)
          </SChip>
          <SChip active={selectedType === 'PERCENT'} onClick={() => onSelectType('PERCENT')}>
            Percentual (%)
          </SChip>
        </div>
        <div className="s-input">
          <input autoFocus placeholder={placeholder} {...register('raw')} />
        </div>
        <div className="flex gap-2 justify-between mt-3.5">
          <SBtn ghost onClick={onRemove}>
            Remover desconto
          </SBtn>
          <div className="flex gap-2">
            <SBtn ghost onClick={onClose}>
              Voltar
            </SBtn>
            <SBtn primary type="submit" disabled={!canApply}>
              Aplicar
            </SBtn>
          </div>
        </div>
      </form>
    </SModal>
  );
}
