import { clsx } from 'clsx';
import { SKbd } from '@/components/sol';
import { PAYMENT_TILES } from './PaymentTiles.constants';
import type { PaymentTilesProps } from './PaymentTiles.types';

export function PaymentTiles({ payment, onSelectPayment }: PaymentTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PAYMENT_TILES.map(([method, label, key]) => (
        <button
          key={method}
          className={clsx('s-paytile', payment === method && 'is-active')}
          onClick={() => onSelectPayment(method)}
          type="button"
          aria-label={`Pagamento ${label}`}
          aria-pressed={payment === method}
        >
          <b>{label}</b>
          <SKbd>{key}</SKbd>
        </button>
      ))}
    </div>
  );
}
