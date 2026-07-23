import { useEffect, useState } from 'react';

// Não é formulário: é um controle inline sincronizado com a quantidade externa
// (muda via +/-) e com saneamento ao vivo (só dígitos). Por isso mantém um
// buffer controlado, sem RHF.
export function useQtyStepperModel(quantity: number, onTyped: (quantity: number) => void) {
  const [raw, setRaw] = useState(String(quantity));

  useEffect(() => setRaw(String(quantity)), [quantity]);

  const changeRaw = (value: string) => setRaw(value.replace(/\D/g, ''));

  const commitTyped = () => {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) onTyped(parsed);
    else setRaw(String(quantity));
  };

  return { raw, changeRaw, commitTyped };
}
