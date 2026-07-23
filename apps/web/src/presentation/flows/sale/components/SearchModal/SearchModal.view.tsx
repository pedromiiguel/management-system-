import { Search } from 'lucide-react';
import { SModal, STable } from '@/components/sol';
import type { SearchModalViewProps } from './SearchModal.types';

export function SearchModalView({
  register,
  rows,
  emptyText,
  onSubmit,
  onClose,
}: SearchModalViewProps) {
  return (
    <SModal title="Buscar produto (F2)" onClose={onClose} width={480}>
      <form onSubmit={onSubmit}>
        <div className="s-input mb-2.5">
          <Search size={15} />
          <input autoFocus placeholder="Nome, SKU ou código de barras…" {...register('search')} />
        </div>
      </form>
      <STable
        cols={['Produto', 'Estoque', 'Preço']}
        widths="1fr 70px 90px"
        align={[null, 'center', 'right']}
        dense
        emptyText={emptyText}
        rows={rows}
      />
    </SModal>
  );
}
