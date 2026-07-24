import { SBtn, SCard, SStat, STable } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import { ManualEntryModal } from './components/ManualEntryModal';
import type { EntriesTabViewProps } from './EntriesTab.types';

export function EntriesTabView({
  from,
  onChangeFrom,
  to,
  onChangeTo,
  inflows,
  outflows,
  balance,
  rows,
  creating,
  onOpenCreate,
  onCloseCreate,
  onCreated,
}: EntriesTabViewProps) {
  return (
    <>
      <div className="flex gap-2.5 items-end">
        <div>
          <div className="s-label">De</div>
          <div className="s-input"><input type="date" value={from} onChange={(e) => onChangeFrom(e.target.value)} /></div>
        </div>
        <div>
          <div className="s-label">Até</div>
          <div className="s-input"><input type="date" value={to} onChange={(e) => onChangeTo(e.target.value)} /></div>
        </div>
        <span className="flex-1" />
        <SBtn primary onClick={onOpenCreate}>+ Lançamento avulso</SBtn>
      </div>
      <div className="flex gap-3">
        <SStat label="Entradas" value={formatBRL(inflows)} />
        <SStat label="Saídas" value={formatBRL(outflows)} />
        <SStat label="Saldo do período" value={formatBRL(balance)} accent />
      </div>
      <SCard pad={8} className="flex-1 min-h-0 overflow-auto">
        <STable
          cols={['Data', 'Descrição', 'Categoria', 'Forma', 'Valor']}
          widths="110px 1fr 150px 90px 110px"
          align={[null, null, null, null, 'right']}
          dense
          emptyText="Nenhum movimento no período"
          rows={rows}
        />
      </SCard>
      {creating ? <ManualEntryModal onDone={onCreated} onClose={onCloseCreate} /> : null}
    </>
  );
}
