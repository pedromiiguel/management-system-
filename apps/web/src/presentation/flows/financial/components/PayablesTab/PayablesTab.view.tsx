import { SBtn, SCard, STable } from '@/components/sol';
import { PayableModal } from './components/PayableModal';
import type { PayablesTabViewProps } from './PayablesTab.types';

export function PayablesTabView({
  rows,
  creating,
  onOpenCreate,
  onCloseCreate,
  onCreated,
}: PayablesTabViewProps) {
  return (
    <SCard pad={8} className="flex-1 min-h-0 overflow-auto">
      <div className="flex justify-between px-2.5 pt-2 pb-1">
        <div className="s-card-title m-0">Contas em aberto</div>
        <SBtn primary onClick={onOpenCreate}>+ Nova conta</SBtn>
      </div>
      <STable
        cols={['Descrição', 'Fornecedor', 'Categoria', 'Vencimento', 'Valor', '']}
        widths="1fr 140px 130px 110px 100px 100px"
        align={[null, null, null, null, 'right', 'right']}
        dense
        emptyText="Nenhuma conta em aberto ✓"
        rows={rows}
      />
      {creating ? <PayableModal onDone={onCreated} onClose={onCloseCreate} /> : null}
    </SCard>
  );
}
