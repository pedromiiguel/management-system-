import { useState } from 'react';
import type { Customer } from '@/domain/models/sale';
import { useCreateCustomerMutation } from '@/main/factories/mutations/sale';
import { useSearchCustomersQuery } from '@/main/factories/queries/sale';
import { SBtn, SModal, SolIcon, STable, useToast } from '../../../components/sol';
import { apiErrorMessage } from '../../../lib/api';
import { formatBRL } from '../../../lib/format';

export function CustomerModal({
  onPick,
  onClose,
}: {
  onPick: (customer: Customer) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const { data: customers = [], refetch } = useSearchCustomersQuery(search);
  const createCustomer = useCreateCustomerMutation();

  const handleCreate = () => {
    createCustomer.mutate(newName.trim(), {
      onSuccess: (created) => {
        void refetch();
        onPick({ ...created, openBalance: 0 });
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  };

  return (
    <SModal title="Cliente do fiado (F8)" onClose={onClose} width={460}>
      <div className="s-input" style={{ marginBottom: 10 }}>
        <SolIcon name="search" size={15} />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cliente…"
        />
      </div>
      <STable
        cols={['Nome', 'Em aberto']}
        widths="1fr 110px"
        align={[null, 'right']}
        dense
        emptyText="Nenhum cliente"
        rows={customers.map((customer) => ({
          key: customer.id,
          onClick: () => onPick(customer),
          cells: [customer.name, formatBRL(customer.openBalance)],
        }))}
      />
      <div className="s-divider" />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="s-input" style={{ flex: 1 }}>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Novo cliente — nome"
          />
        </div>
        <SBtn ghost disabled={newName.trim().length < 2} onClick={handleCreate}>
          + Cadastrar
        </SBtn>
      </div>
    </SModal>
  );
}
