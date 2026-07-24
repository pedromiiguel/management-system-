import { Search } from 'lucide-react';
import { Screen } from '@/presentation/components/Screen';
import { SBtn, SCard, SChip, STable } from '@/components/sol';
import { ProductModal } from '../components/ProductModal';
import { StockEntryModal } from '@/presentation/flows/stock/components/StockEntryModal';
import type { ProductsPageViewProps } from './ProductsPage.types';

export function ProductsPageView({
  search,
  onChangeSearch,
  filter,
  onChangeFilter,
  total,
  lowCount,
  expiringCount,
  rows,
  page,
  hasNextPage,
  onPrevPage,
  onNextPage,
  modal,
  onOpenNewProduct,
  onOpenNewEntry,
  onCloseModal,
  onSaved,
}: ProductsPageViewProps) {
  return (
    <Screen
      title="Produtos & Estoque"
      topRight={
        <>
          <SBtn ghost onClick={onOpenNewEntry}>Entrada de estoque</SBtn>
          <SBtn primary onClick={onOpenNewProduct}>+ Novo produto</SBtn>
        </>
      }
    >
      <div className="flex flex-col gap-3 h-full">
        <div className="flex gap-2.5 items-center">
          <div className="s-input w-[400px]">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Buscar por nome, SKU ou código de barras…"
            />
          </div>
          <SChip active={filter === 'all'} onClick={() => onChangeFilter('all')}>
            Todos · {total}
          </SChip>
          <SChip active={filter === 'active'} onClick={() => onChangeFilter('active')}>Ativos</SChip>
          <SChip active={filter === 'low'} onClick={() => onChangeFilter('low')}>
            Estoque baixo · {lowCount}
          </SChip>
          <SChip active={filter === 'expiring'} onClick={() => onChangeFilter('expiring')}>
            Vencimento próximo · {expiringCount}
          </SChip>
        </div>

        <SCard pad={8} className="flex-1 min-h-0 overflow-auto">
          <STable
            cols={['SKU', 'Código de barras', 'Produto', 'Preço venda', 'Estoque', 'Mín.', 'Situação', 'Ações']}
            widths="80px 140px 1fr 110px 80px 60px 150px 60px"
            align={[null, null, null, 'right', 'center', 'center', null, 'center']}
            dense
            rows={rows}
          />
        </SCard>

        <div className="flex justify-between items-center">
          <span className="s-dim text-[12.5px]">
            Produtos com venda registrada não são excluídos — apenas desativados.
          </span>
          <span className="flex gap-1.5 items-center">
            <SBtn ghost disabled={page <= 1} onClick={onPrevPage}>‹</SBtn>
            <span className="s-dim text-[13px]">página {page}</span>
            <SBtn ghost disabled={!hasNextPage} onClick={onNextPage}>›</SBtn>
          </span>
        </div>
      </div>

      {modal.kind === 'product' && (
        <ProductModal product={modal.product} onSaved={onSaved} onClose={onCloseModal} />
      )}
      {modal.kind === 'entry' && (
        <StockEntryModal product={modal.product} onSaved={onSaved} onClose={onCloseModal} />
      )}
    </Screen>
  );
}
