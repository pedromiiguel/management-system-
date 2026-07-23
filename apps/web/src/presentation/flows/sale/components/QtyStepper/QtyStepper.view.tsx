import type { QtyStepperViewProps } from './QtyStepper.types';

export function QtyStepperView({
  raw,
  canDecrement,
  onDecrement,
  onIncrement,
  onChangeRaw,
  onCommit,
}: QtyStepperViewProps) {
  return (
    <div className="s-qty-stepper" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={!canDecrement}
        onClick={onDecrement}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <input
        value={raw}
        inputMode="numeric"
        aria-label="Quantidade"
        onChange={(event) => onChangeRaw(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
      <button type="button" onClick={onIncrement} aria-label="Aumentar quantidade">
        +
      </button>
    </div>
  );
}
