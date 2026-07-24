export type MoneyPromptModalProps = {
  title: string;
  label: string;
  submitLabel: string;
  onSubmit: (value: number) => void;
  onClose: () => void;
};

export type MoneyPromptModalViewProps = {
  title: string;
  label: string;
  submitLabel: string;
  raw: string;
  valid: boolean;
  onChangeRaw: (raw: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};
