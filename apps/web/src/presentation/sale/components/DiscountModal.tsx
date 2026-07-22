import { useState } from 'react';
import type { DiscountInput } from '@/domain/models/sale';
import { SBtn, SChip, SModal } from '../../../components/sol';
import { parseMoney } from '../../../lib/format';

export function DiscountModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (discount: DiscountInput | null) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [raw, setRaw] = useState('');
  const value = parseMoney(raw);
  const valid = Number.isFinite(value) && value >= 0 && (type !== 'PERCENT' || value <= 100);
  return (
    <SModal title="Desconto na venda (F4)" onClose={onClose} width={380}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <SChip active={type === 'AMOUNT'} onClick={() => setType('AMOUNT')}>Valor (R$)</SChip>
        <SChip active={type === 'PERCENT'} onClick={() => setType('PERCENT')}>Percentual (%)</SChip>
      </div>
      <div className="s-input">
        <input
          autoFocus
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={type === 'AMOUNT' ? '0,00' : '0'}
          onKeyDown={(event) => event.key === 'Enter' && valid && onSubmit({ type, value })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 14 }}>
        <SBtn ghost onClick={() => onSubmit(null)}>Remover desconto</SBtn>
        <div style={{ display: 'flex', gap: 8 }}>
          <SBtn ghost onClick={onClose}>Voltar</SBtn>
          <SBtn primary disabled={!valid} onClick={() => onSubmit({ type, value })}>Aplicar</SBtn>
        </div>
      </div>
    </SModal>
  );
}
