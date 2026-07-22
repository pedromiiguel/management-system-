import { useEffect, useState } from 'react';

// Alterar quantidade de um item já na venda (FR-14) — +/- ou digitação direta,
// sem precisar rebipar o produto. Ver CONTEXT.md ("Alterar quantidade").
export function QtyStepper({
  quantity,
  onStep,
  onTyped,
  onDone,
}: {
  quantity: number;
  onStep: (delta: number) => void;
  onTyped: (quantity: number) => void;
  onDone: () => void;
}) {
  const [raw, setRaw] = useState(String(quantity));
  useEffect(() => setRaw(String(quantity)), [quantity]);

  const commitTyped = () => {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) onTyped(parsed);
    else setRaw(String(quantity));
  };

  return (
    <div className="s-qty-stepper" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={quantity <= 1}
        onClick={() => onStep(-1)}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <input
        value={raw}
        inputMode="numeric"
        aria-label="Quantidade"
        onChange={(event) => setRaw(event.target.value.replace(/\D/g, ''))}
        onBlur={() => {
          commitTyped();
          onDone();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            (event.target as HTMLInputElement).blur();
          }
        }}
      />
      <button type="button" onClick={() => onStep(1)} aria-label="Aumentar quantidade">
        +
      </button>
    </div>
  );
}
