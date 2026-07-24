import { SBtn, SModal } from '@/components/sol';
import type { PayableModalViewProps } from './PayableModal.types';

export function PayableModalView({
  description,
  supplier,
  raw,
  dueDate,
  categoryId,
  categories,
  valid,
  saving,
  onChangeDescription,
  onChangeSupplier,
  onChangeRaw,
  onChangeDueDate,
  onChangeCategoryId,
  onSubmit,
  onClose,
}: PayableModalViewProps) {
  return (
    <SModal title="Nova conta a pagar" onClose={onClose} width={460}>
      <div className="flex flex-col gap-2.5">
        <div>
          <div className="s-label">Descrição</div>
          <div className="s-input">
            <input
              autoFocus
              data-testid="payable-description"
              value={description}
              onChange={(e) => onChangeDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="s-label">Fornecedor — opcional</div>
            <div className="s-input"><input value={supplier} onChange={(e) => onChangeSupplier(e.target.value)} /></div>
          </div>
          <div className="w-[130px]">
            <div className="s-label">Valor (R$)</div>
            <div className="s-input">
              <input
                data-testid="payable-amount"
                value={raw}
                onChange={(e) => onChangeRaw(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          <div className="flex-1">
            <div className="s-label">Vencimento</div>
            <div className="s-input">
              <input type="date" value={dueDate} onChange={(e) => onChangeDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex-1">
            <div className="s-label">Categoria</div>
            <div className="s-input">
              <select value={categoryId} onChange={(e) => onChangeCategoryId(e.target.value)}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <SBtn ghost onClick={onClose}>Voltar</SBtn>
          <SBtn primary disabled={!valid || saving} onClick={onSubmit}>Salvar</SBtn>
        </div>
      </div>
    </SModal>
  );
}
