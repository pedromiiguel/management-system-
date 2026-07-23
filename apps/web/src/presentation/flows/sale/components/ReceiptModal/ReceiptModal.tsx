import { buildCupom, STORE } from '@/lib/cupom';
import { useReceiptModalModel } from './ReceiptModal.model';
import { ReceiptModalView } from './ReceiptModal.view';
import type { ReceiptModalProps } from './ReceiptModal.types';

// Cupom não-fiscal (FR-23) — o <pre> exibido é exatamente o texto que vai para
// a impressora térmica de 80mm (ver lib/cupom.ts e o @media print).
export function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  useReceiptModalModel(onClose);
  const receipt = buildCupom(sale, STORE);

  return <ReceiptModalView receipt={receipt} onPrint={() => window.print()} onClose={onClose} />;
}
