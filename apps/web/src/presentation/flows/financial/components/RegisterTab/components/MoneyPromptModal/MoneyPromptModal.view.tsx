import { SBtn, SModal } from '@/components/sol';
import type { MoneyPromptModalViewProps } from './MoneyPromptModal.types';

export function MoneyPromptModalView({
  title,
  label,
  submitLabel,
  raw,
  valid,
  onChangeRaw,
  onSubmit,
  onClose,
}: MoneyPromptModalViewProps) {
  return (
    <SModal title={title} onClose={onClose} width={380}>
      <div className="s-label">{label}</div>
      <div className="s-input">
        <input
          autoFocus
          value={raw}
          onChange={(e) => onChangeRaw(e.target.value)}
          placeholder="0,00"
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit()}
        />
      </div>
      <div className="flex gap-2 justify-end mt-3.5">
        <SBtn ghost onClick={onClose}>Voltar</SBtn>
        <SBtn primary disabled={!valid} onClick={onSubmit}>{submitLabel}</SBtn>
      </div>
    </SModal>
  );
}
