import { ScanBarcode } from 'lucide-react';
import { clsx } from 'clsx';
import { SKbd } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import type { ScanBoxProps } from './ScanBox.types';

export function ScanBox({
  scanRef,
  scan,
  onScanChange,
  onScanKeyDown,
  suggestOpen,
  suggestions,
  highlighted,
  onPickSuggestion,
}: ScanBoxProps) {
  return (
    <div className="relative">
      <div className="s-scan">
        <ScanBarcode size={22} />
        <input
          ref={scanRef}
          autoFocus
          aria-label="Código de barras, SKU ou nome do produto"
          value={scan}
          onChange={(event) => onScanChange(event.target.value)}
          onKeyDown={onScanKeyDown}
          placeholder="Passe o código de barras ou digite o nome / SKU…"
        />
        <SKbd>F2</SKbd>
      </div>
      {suggestOpen ? (
        <div className="s-suggest" role="listbox" aria-label="Sugestões de produto">
          {suggestions.map((product, index) => (
            <div
              key={product.id}
              role="option"
              aria-selected={index === highlighted}
              className={clsx('s-suggest-item', index === highlighted && 'is-active')}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPickSuggestion(product)}
            >
              <span>{product.name}</span>
              <span className="s-dim text-xs">
                {formatBRL(product.salePrice)} · estoque {product.currentStock}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
