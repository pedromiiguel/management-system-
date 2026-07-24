import { Screen } from '@/presentation/components/Screen';
import { SBtn, SCard, STable } from '@/components/sol';
import { AdjustModal } from '../components/AdjustModal';
import { StockEntryModal } from '../components/StockEntryModal';
import type { StockPageViewProps } from './StockPage.types';

export function StockPageView({
  movements,
  lowStock,
  expiring,
  modal,
  onOpenEntry,
  onOpenAdjust,
  onCloseModal,
  onSaved,
}: StockPageViewProps) {
  return (
    <Screen
      title="Estoque"
      topRight={
        <>
          <SBtn ghost onClick={onOpenAdjust}>Ajuste manual</SBtn>
          <SBtn primary onClick={onOpenEntry}>Entrada de estoque</SBtn>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_350px] gap-3 h-full">
        <SCard pad={8} className="min-h-0 overflow-auto">
          <div className="s-card-title pt-2 px-2.5 pb-1">Movimentações recentes</div>
          <STable
            cols={['Data', 'Produto', 'Tipo', 'Origem', 'Qtd']}
            widths="110px 1fr 80px 150px 60px"
            align={[null, null, null, null, 'center']}
            dense
            rows={movements}
          />
        </SCard>

        <div className="flex flex-col gap-3 min-h-0 overflow-auto">
          <SCard>
            <div className="s-card-title">Estoque abaixo do mínimo (FR-07)</div>
            <STable
              cols={['Produto', 'Atual', 'Mín.']}
              widths="1fr 60px 50px"
              align={[null, 'center', 'center']}
              dense
              emptyText="Tudo acima do mínimo ✓"
              rows={lowStock}
            />
          </SCard>
          <SCard>
            <div className="s-card-title">Vencimento próximo — FEFO (FR-08)</div>
            <STable
              cols={['Produto', 'Lote', 'Validade', 'Qtd']}
              widths="1fr 60px 90px 50px"
              align={[null, null, null, 'center']}
              dense
              emptyText="Nenhum lote vencendo ✓"
              rows={expiring}
            />
          </SCard>
        </div>
      </div>

      {modal === 'entry' && <StockEntryModal onSaved={onSaved} onClose={onCloseModal} />}
      {modal === 'adjust' && <AdjustModal onSaved={onSaved} onClose={onCloseModal} />}
    </Screen>
  );
}
