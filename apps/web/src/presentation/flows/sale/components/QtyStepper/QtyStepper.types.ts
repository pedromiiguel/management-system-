export type QtyStepperProps = {
  quantity: number;
  onStep: (delta: number) => void;
  onTyped: (quantity: number) => void;
  onDone: () => void;
};

export type QtyStepperViewProps = {
  raw: string;
  canDecrement: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
  onChangeRaw: (value: string) => void;
  onCommit: () => void;
};
