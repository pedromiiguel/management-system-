import { Search } from 'lucide-react';
import { SBtn, SModal, STable } from '@/components/sol';
import type { CustomerModalViewProps } from './CustomerModal.types';

export function CustomerModalView({
  registerFilter,
  rows,
  register,
  onSubmit,
  canCreate,
  onClose,
}: CustomerModalViewProps) {
  return (
    <SModal title="Cliente do fiado (F8)" onClose={onClose} width={460}>
      <div className="s-input mb-2.5">
        <Search size={15} />
        <input autoFocus placeholder="Buscar cliente…" {...registerFilter('search')} />
      </div>
      <STable
        cols={['Nome', 'Em aberto']}
        widths="1fr 110px"
        align={[null, 'right']}
        dense
        emptyText="Nenhum cliente"
        rows={rows}
      />
      <div className="s-divider" />
      <form className="flex gap-2" onSubmit={onSubmit}>
        <div className="s-input flex-1">
          <input placeholder="Novo cliente — nome" {...register('name')} />
        </div>
        <SBtn ghost type="submit" disabled={!canCreate}>
          + Cadastrar
        </SBtn>
      </form>
    </SModal>
  );
}
