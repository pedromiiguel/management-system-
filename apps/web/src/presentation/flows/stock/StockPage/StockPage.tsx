import { STag } from '@/components/sol';
import { formatDate, formatDateTime } from '@/lib/format';
import { SOURCE_LABELS } from './StockPage.constants';
import { useStockPageModel } from './StockPage.model';
import { StockPageView } from './StockPage.view';
import type { ExpiringRow, LowStockRow, MovementRow } from './StockPage.types';

export function StockPage() {
  const { modal, setModal, alerts, movements, onSaved } = useStockPageModel();

  const movementRows: MovementRow[] = movements.map((m) => ({
    key: m.id,
    cells: [
      formatDateTime(m.createdAt),
      <span key="p">
        {m.product.name}
        {m.note ? <span className="s-dim"> — {m.note}</span> : null}
      </span>,
      m.type === 'ENTRY' ? (
        <STag key="t" tone="ok">entrada</STag>
      ) : (
        <STag key="t" tone="dim">saída</STag>
      ),
      SOURCE_LABELS[m.source],
      <b key="q">{m.type === 'ENTRY' ? '+' : '−'}{m.quantity}</b>,
    ],
  }));

  const lowStockRows: LowStockRow[] = (alerts?.lowStock ?? []).map((p) => ({
    key: p.id,
    cells: [p.name, <b key="c" className="s-low">{p.currentStock}</b>, p.minimumStock],
  }));

  const expiringRows: ExpiringRow[] = (alerts?.expiring ?? []).map((b) => ({
    key: b.id,
    cells: [
      b.product.name,
      b.batch ?? '—',
      <STag key="v" tone="warn">{formatDate(b.expiresAt)}</STag>,
      b.quantity,
    ],
  }));

  return (
    <StockPageView
      movements={movementRows}
      lowStock={lowStockRows}
      expiring={expiringRows}
      modal={modal}
      onOpenEntry={() => setModal('entry')}
      onOpenAdjust={() => setModal('adjust')}
      onCloseModal={() => setModal('none')}
      onSaved={onSaved}
    />
  );
}
