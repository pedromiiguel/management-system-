import { useState } from 'react';
import type { Product } from '@/domain/models/sale';
import { useSearchProductsQuery } from '@/main/factories/queries/sale';
import { SModal, SolIcon, STable } from '../../../components/sol';
import { formatBRL } from '../../../lib/format';

export function SearchModal({
  initialQuery,
  onPick,
  onClose,
}: {
  initialQuery?: string;
  onPick: (product: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState(initialQuery ?? '');
  const { data } = useSearchProductsQuery(search, 8);
  const results = data?.items ?? [];

  return (
    <SModal title="Buscar produto (F2)" onClose={onClose} width={480}>
      <div className="s-input" style={{ marginBottom: 10 }}>
        <SolIcon name="search" size={15} />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome, SKU ou código de barras…"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results[0]) onPick(results[0]);
          }}
        />
      </div>
      <STable
        cols={['Produto', 'Estoque', 'Preço']}
        widths="1fr 70px 90px"
        align={[null, 'center', 'right']}
        dense
        emptyText={search.length >= 2 ? 'Nada encontrado' : 'Digite ao menos 2 caracteres'}
        rows={results.map((product) => ({
          key: product.id,
          onClick: () => onPick(product),
          cells: [product.name, product.currentStock, formatBRL(product.salePrice)],
        }))}
      />
    </SModal>
  );
}
