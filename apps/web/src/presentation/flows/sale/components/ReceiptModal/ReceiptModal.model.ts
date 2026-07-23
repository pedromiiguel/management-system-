import { useHotkey } from '@tanstack/react-hotkeys';

// Enter fecha o cupom e inicia a nova venda (ignoreInputs: false para valer
// mesmo com foco em algum input).
export function useReceiptModalModel(onClose: () => void) {
  useHotkey('Enter', onClose, { ignoreInputs: false });
}
