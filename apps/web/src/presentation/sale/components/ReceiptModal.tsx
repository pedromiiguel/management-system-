import { useHotkey } from '@tanstack/react-hotkeys';
import type { Sale } from '@/domain/models/sale';
import { SBtn, SModal } from '../../../components/sol';
import { buildCupom, STORE } from '../../../lib/cupom';

// Cupom não-fiscal (FR-23) — o <pre> exibido é exatamente o texto que vai
// para a impressora térmica de 80mm (ver lib/cupom.ts e o @media print).
export function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <SModal title="Venda concluída ✓" onClose={onClose} width={420}>
      <pre className="s-receipt s-cupom">{buildCupom(sale, STORE)}</pre>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <SBtn ghost onClick={() => window.print()}>Imprimir</SBtn>
        <SBtn primary onClick={onClose}>Nova venda (Enter)</SBtn>
      </div>
      <EnterToClose onClose={onClose} />
    </SModal>
  );
}

function EnterToClose({ onClose }: { onClose: () => void }) {
  useHotkey('Enter', onClose, { ignoreInputs: false });
  return null;
}
