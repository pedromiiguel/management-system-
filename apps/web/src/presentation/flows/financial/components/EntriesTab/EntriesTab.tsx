import { PAYMENT_METHOD_LABELS } from '@beverage/shared';
import { formatBRL, formatDateTime } from '@/lib/format';
import { useEntriesTabModel } from './EntriesTab.model';
import { EntriesTabView } from './EntriesTab.view';
import type { EntryRow } from './EntriesTab.types';

export function EntriesTab() {
  const { from, setFrom, to, setTo, data, creating, setCreating, onCreated } = useEntriesTabModel();

  const rows: EntryRow[] = (data?.movements ?? []).map((m) => ({
    key: m.id,
    cells: [
      formatDateTime(m.occurredAt),
      m.description,
      m.category?.name ?? '—',
      m.paymentMethod ? PAYMENT_METHOD_LABELS[m.paymentMethod] : '—',
      <b key="v" className={m.type === 'OUTFLOW' ? 'text-[color:var(--danger)]' : undefined}>
        {m.type === 'INFLOW' ? '+' : '−'}
        {formatBRL(m.amount)}
      </b>,
    ],
  }));

  return (
    <EntriesTabView
      from={from}
      onChangeFrom={setFrom}
      to={to}
      onChangeTo={setTo}
      inflows={Number(data?.inflows ?? 0)}
      outflows={Number(data?.outflows ?? 0)}
      balance={Number(data?.balance ?? 0)}
      rows={rows}
      creating={creating}
      onOpenCreate={() => setCreating(true)}
      onCloseCreate={() => setCreating(false)}
      onCreated={onCreated}
    />
  );
}
