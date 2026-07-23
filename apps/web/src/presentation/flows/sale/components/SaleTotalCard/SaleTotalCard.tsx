import { SCard } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import type { SaleTotalCardProps } from './SaleTotalCard.types';

export function SaleTotalCard({ displayTotal, itemCount, productCount }: SaleTotalCardProps) {
  return (
    <SCard pad={18} className="text-center">
      <div className="s-stat-label">TOTAL DA VENDA</div>
      <div className="s-total" data-testid="sale-total">
        {formatBRL(displayTotal)}
      </div>
      <div className="s-dim text-[13px]">
        {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {productCount}{' '}
        {productCount === 1 ? 'produto' : 'produtos'}
      </div>
    </SCard>
  );
}
