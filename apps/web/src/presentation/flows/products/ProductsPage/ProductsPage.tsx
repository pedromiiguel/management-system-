import { useMemo } from 'react';
import { SIconBtn, STag } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import { useProductsPageModel } from './ProductsPage.model';
import { ProductsPageView } from './ProductsPage.view';
import type { ProductRow } from './ProductsPage.types';

const PER_PAGE = 50;

export function ProductsPage() {
  const {
    search,
    changeSearch,
    filter,
    setFilter,
    page,
    setPage,
    data,
    alerts,
    modal,
    setModal,
    handleDelete,
    onSaved,
  } = useProductsPageModel();

  const lowIds = useMemo(() => new Set(alerts?.lowStock.map((p) => p.id) ?? []), [alerts]);
  const expiringIds = useMemo(
    () => new Set(alerts?.expiring.map((b) => b.product.id) ?? []),
    [alerts],
  );
  const expiringByProduct = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of alerts?.expiring ?? []) {
      if (b.expiresAt && !map.has(b.product.id)) {
        const days = Math.ceil((new Date(b.expiresAt).getTime() - Date.now()) / 86_400_000);
        map.set(b.product.id, days <= 0 ? 'vencido' : `vence em ${days}d`);
      }
    }
    return map;
  }, [alerts]);

  const allItems = data?.items ?? [];
  const items = allItems.filter((p) => {
    if (filter === 'active') return p.active;
    if (filter === 'low') return lowIds.has(p.id);
    if (filter === 'expiring') return expiringIds.has(p.id);
    return true;
  });

  const rows: ProductRow[] = items.map((p) => {
    const low = lowIds.has(p.id);
    const expiry = expiringByProduct.get(p.id);
    return {
      key: p.id,
      onClick: () => setModal({ kind: 'product', product: p }),
      cells: [
        p.sku,
        p.ean ?? '—',
        p.name,
        formatBRL(p.salePrice),
        low ? <b key="s" className="s-low">{p.currentStock}</b> : p.currentStock,
        p.minimumStock,
        !p.active ? (
          <STag key="t" tone="dim">inativo</STag>
        ) : expiry ? (
          <STag key="t" tone="warn">{expiry}</STag>
        ) : low ? (
          <STag key="t" tone="warn">estoque baixo</STag>
        ) : (
          <STag key="t" tone="ok">ativo</STag>
        ),
        <SIconBtn
          key="del"
          icon="trash"
          danger
          title="Excluir produto"
          onClick={(e) => {
            e.stopPropagation();
            void handleDelete(p);
          }}
        />,
      ],
    };
  });

  return (
    <ProductsPageView
      search={search}
      onChangeSearch={changeSearch}
      filter={filter}
      onChangeFilter={setFilter}
      total={data?.total ?? 0}
      lowCount={alerts?.lowStock.length ?? 0}
      expiringCount={expiringIds.size}
      rows={rows}
      page={page}
      hasNextPage={(data?.total ?? 0) > page * PER_PAGE}
      onPrevPage={() => setPage((p) => p - 1)}
      onNextPage={() => setPage((p) => p + 1)}
      modal={modal}
      onOpenNewProduct={() => setModal({ kind: 'product' })}
      onOpenNewEntry={() => setModal({ kind: 'entry' })}
      onCloseModal={() => setModal({ kind: 'none' })}
      onSaved={onSaved}
    />
  );
}
