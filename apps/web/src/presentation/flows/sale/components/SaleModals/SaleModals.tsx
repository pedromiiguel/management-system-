import { SBtn, SModal } from '@/components/sol';
import { CustomerModal } from '../CustomerModal';
import { DiscountModal } from '../DiscountModal';
import { ReceiptModal } from '../ReceiptModal';
import { SearchModal } from '../SearchModal';
import type { SaleModalsProps } from './SaleModals.types';

export function SaleModals({
  modal,
  onModalClose,
  onSearchPick,
  onDiscountSubmit,
  onCustomerPick,
  onConfirmCancelClose,
  onCancelSale,
  onReceiptClose,
}: SaleModalsProps) {
  if (modal.kind === 'search') {
    return <SearchModal initialQuery={modal.initialQuery} onPick={onSearchPick} onClose={onModalClose} />;
  }
  if (modal.kind === 'discount') {
    return <DiscountModal onSubmit={onDiscountSubmit} onClose={onModalClose} />;
  }
  if (modal.kind === 'customer') {
    return <CustomerModal onPick={onCustomerPick} onClose={onModalClose} />;
  }
  if (modal.kind === 'confirm-cancel') {
    return (
      <SModal title="Cancelar venda em andamento?" onClose={onConfirmCancelClose}>
        <div className="s-dim text-[13.5px] mb-4">
          Os itens bipados serão descartados. Nenhum estoque ou valor foi movimentado (FR-21).
        </div>
        <div className="flex gap-2 justify-end">
          <SBtn ghost onClick={onConfirmCancelClose}>
            Voltar
          </SBtn>
          <SBtn danger onClick={onCancelSale}>
            Cancelar venda
          </SBtn>
        </div>
      </SModal>
    );
  }
  if (modal.kind === 'receipt') {
    return <ReceiptModal sale={modal.sale} onClose={onReceiptClose} />;
  }
  return null;
}
