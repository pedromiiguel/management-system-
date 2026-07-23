import { SBtn, SModal } from '@/components/sol';
import type { ReceiptModalViewProps } from './ReceiptModal.types';

export function ReceiptModalView({ receipt, onPrint, onClose }: ReceiptModalViewProps) {
  return (
    <SModal title="Venda concluída ✓" onClose={onClose} width={420}>
      <pre className="s-receipt s-cupom">{receipt}</pre>
      <div className="flex gap-2 justify-end mt-4">
        <SBtn ghost onClick={onPrint}>
          Imprimir
        </SBtn>
        <SBtn primary onClick={onClose}>
          Nova venda (Enter)
        </SBtn>
      </div>
    </SModal>
  );
}
