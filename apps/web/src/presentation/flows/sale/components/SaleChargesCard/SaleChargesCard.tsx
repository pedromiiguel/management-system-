import { SCard, SKbd, SToggle } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import type { SaleChargesCardProps } from './SaleChargesCard.types';

export function SaleChargesCard({
  discountLabel,
  serviceFee,
  feeValue,
  onToggleServiceFee,
  withInvoice,
  onToggleInvoice,
}: SaleChargesCardProps) {
  return (
    <SCard pad={12}>
      <div className="flex justify-between items-center">
        <span className="text-[13.5px]">Desconto</span>
        <span className="s-dim text-[13px]">
          <span data-testid="sale-discount-value">{discountLabel}</span> <SKbd>F4</SKbd>
        </span>
      </div>
      <div className="s-divider" />
      <div className="flex justify-between items-center">
        <span className="text-[13.5px]">Taxa de serviço (10%)</span>
        <span className="flex items-center gap-2">
          {serviceFee ? (
            <span className="s-dim text-[13px]" data-testid="sale-service-fee-value">
              {formatBRL(feeValue)}
            </span>
          ) : null}
          <SToggle on={serviceFee} onChange={onToggleServiceFee} ariaLabel="Taxa de serviço" />
        </span>
      </div>
      <div className="s-divider" />
      <div className="flex justify-between items-center">
        <span className="text-[13.5px]">Emitir nota fiscal</span>
        <SToggle on={withInvoice} onChange={onToggleInvoice} ariaLabel="Emitir nota fiscal" />
      </div>
    </SCard>
  );
}
