import { SKbd } from '@/components/sol';

export function SaleHotkeyStrip() {
  return (
    <div className="s-strip">
      <span>
        <SKbd>F2</SKbd> buscar
      </span>
      <span>
        <SKbd>F4</SKbd> desconto
      </span>
      <span>
        <SKbd>Del</SKbd> remover
      </span>
      <span>
        <SKbd>F10</SKbd> finalizar
      </span>
      <span>
        <SKbd>Esc</SKbd> cancelar
      </span>
    </div>
  );
}
