import { useMoneyPromptModalModel } from './MoneyPromptModal.model';
import { MoneyPromptModalView } from './MoneyPromptModal.view';
import type { MoneyPromptModalProps } from './MoneyPromptModal.types';

export function MoneyPromptModal({ title, label, submitLabel, onSubmit, onClose }: MoneyPromptModalProps) {
  const { raw, setRaw, value, valid } = useMoneyPromptModalModel();

  return (
    <MoneyPromptModalView
      title={title}
      label={label}
      submitLabel={submitLabel}
      raw={raw}
      valid={valid}
      onChangeRaw={setRaw}
      onSubmit={() => onSubmit(value)}
      onClose={onClose}
    />
  );
}
