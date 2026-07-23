import { formatBRL } from '@/lib/format';
import { useSearchModalModel } from './SearchModal.model';
import { SearchModalView } from './SearchModal.view';
import type { ProductRow, SearchModalProps } from './SearchModal.types';

const MIN_SEARCH_LENGTH = 2;

export function SearchModal({ initialQuery, onPick, onClose }: SearchModalProps) {
  const { register, search, results, submitFirst } = useSearchModalModel(
    initialQuery ?? '',
    onPick,
  );

  const rows: ProductRow[] = results.map((product) => ({
    key: product.id,
    onClick: () => onPick(product),
    cells: [product.name, product.currentStock, formatBRL(product.salePrice)],
  }));

  const emptyText =
    search.length >= MIN_SEARCH_LENGTH
      ? 'Nada encontrado'
      : `Digite ao menos ${MIN_SEARCH_LENGTH} caracteres`;

  return (
    <SearchModalView
      register={register}
      rows={rows}
      emptyText={emptyText}
      onSubmit={submitFirst}
      onClose={onClose}
    />
  );
}
