import { Search } from 'lucide-react';
import { SBtn, SModal, STable } from '@/components/sol';
import type { AdjustModalViewProps } from './AdjustModal.types';

export function AdjustModalView({
  picked,
  onUnpick,
  registerFilter,
  showResults,
  rows,
  register,
  errors,
  onSubmit,
  saving,
  canSubmit,
  onClose,
}: AdjustModalViewProps) {
  return (
    <SModal title="Ajuste manual de estoque" onClose={onClose} width={460}>
      {!picked ? (
        <>
          <div className="s-input mb-2.5">
            <Search size={15} />
            <input autoFocus placeholder="Buscar produto…" {...registerFilter('search')} />
          </div>
          <STable
            cols={['Produto', 'Estoque']}
            widths="1fr 80px"
            align={[null, 'center']}
            dense
            emptyText={showResults ? 'Nada encontrado' : 'Digite para buscar'}
            rows={rows}
          />
        </>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="s-kv">
            <span>Produto</span>
            <b>{picked.name} (estoque: {picked.currentStock})</b>
          </div>
          <div>
            <div className="s-label">Quantidade (positivo aumenta, negativo reduz)</div>
            <div className="s-input">
              <input
                autoFocus
                type="number"
                placeholder="ex.: -3 (quebra), 10 (inventário)"
                {...register('quantity', { valueAsNumber: true })}
              />
            </div>
            {errors.quantity && <div className="s-error">{errors.quantity.message}</div>}
          </div>
          <div>
            <div className="s-label">Motivo (auditável)</div>
            <div className="s-input">
              <input
                placeholder="ex.: quebra, perda, contagem de inventário"
                {...register('reason')}
              />
            </div>
            {errors.reason && <div className="s-error">{errors.reason.message}</div>}
          </div>
          <div className="flex gap-2 justify-end">
            <SBtn ghost onClick={onUnpick}>Trocar produto</SBtn>
            <SBtn primary type="submit" disabled={!canSubmit || saving}>
              {saving ? 'Salvando…' : 'Registrar ajuste'}
            </SBtn>
          </div>
        </form>
      )}
    </SModal>
  );
}
