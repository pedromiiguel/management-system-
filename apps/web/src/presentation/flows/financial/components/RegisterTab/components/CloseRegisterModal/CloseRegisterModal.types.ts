export type CloseRegisterModalProps = {
  expected: number;
  onDone: () => void;
  onClose: () => void;
};

export type CloseRegisterModalViewProps = {
  expected: number;
  raw: string;
  valid: boolean;
  difference: number | null;
  saving: boolean;
  onChangeRaw: (raw: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};
