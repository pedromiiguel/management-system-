import { Search } from 'lucide-react';
import { SBtn, SModal, STable } from '@/components/sol';
import type { StockEntryModalViewProps } from './StockEntryModal.types';

export function StockEntryModalView({
  picked,
  onUnpick,
  registerFilter,
  showResults,
  rows,
  register,
  errors,
  onSubmit,
  saving,
  onClose,
}: StockEntryModalViewProps) {
  return (
    <SModal title="Entrada de estoque" onClose={onClose} width={480}>
      {!picked ? (
        <>
          <div className="s-input mb-2.5">
            <Search size={15} />
            <input
              autoFocus
              placeholder="Buscar produto…"
              {...registerFilter('search')}
            />
          </div>
          <STable
            cols={['Produto', 'Estoque']}
            widths="1fr 80px"
            align={[null, 'center']}
            dense
            emptyText={showResults ? 'Nada encontrado' : 'Digite para buscar o produto'}
            rows={rows}
          />
        </>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="s-kv">
            <span>Produto</span>
            <b>{picked.name} (estoque: {picked.currentStock})</b>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <div className="s-label">Quantidade</div>
              <div className="s-input">
                <input
                  autoFocus
                  type="number"
                  min="1"
                  data-testid="entry-quantity"
                  {...register('quantity', { valueAsNumber: true })}
                />
              </div>
              {errors.quantity && <div className="s-error">{errors.quantity.message}</div>}
            </div>
            <div className="flex-1">
              <div className="s-label">Custo unitário (R$) — opcional</div>
              <div className="s-input">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('unitCost', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <div className="s-label">Lote — opcional</div>
              <div className="s-input">
                <input {...register('batch', { setValueAs: (v: string) => v || undefined })} />
              </div>
            </div>
            <div className="flex-1">
              <div className="s-label">Validade — opcional</div>
              <div className="s-input">
                <input
                  type="date"
                  data-testid="entry-expires-at"
                  {...register('expiresAt', {
                    setValueAs: (v: string) => (v ? new Date(v) : undefined),
                  })}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <SBtn ghost onClick={onUnpick}>Trocar produto</SBtn>
            <SBtn primary type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Registrar entrada'}
            </SBtn>
          </div>
        </form>
      )}
    </SModal>
  );
}
