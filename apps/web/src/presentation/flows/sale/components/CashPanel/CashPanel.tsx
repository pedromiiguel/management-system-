import { SCard } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import type { CashPanelProps } from './CashPanel.types';

export function CashPanel({ received, onReceivedChange, onReceivedEnter, change }: CashPanelProps) {
  return (
    <SCard pad={12}>
      <div className="s-kv">
        <span>Recebido</span>
        {/* inline: sobrescreve o padding do .s-input (classe DS unlayered vence o Tailwind) */}
        <span className="s-input" style={{ width: 120, padding: '4px 10px' }}>
          <input
            value={received}
            onChange={(event) => onReceivedChange(event.target.value)}
            inputMode="numeric"
            placeholder="0,00"
            aria-label="Valor recebido"
            style={{ textAlign: 'right', fontWeight: 700 }}
            onKeyDown={(event) => event.key === 'Enter' && onReceivedEnter()}
          />
        </span>
      </div>
      <div className="s-kv is-troco">
        <span>Troco</span>
        <b data-testid="sale-change">{change !== null && change >= 0 ? formatBRL(change) : '—'}</b>
      </div>
    </SCard>
  );
}
