import { SBtn, SModal } from '@/components/sol';
import { formatBRL } from '@/lib/format';
import type { CloseRegisterModalViewProps } from './CloseRegisterModal.types';

export function CloseRegisterModalView({
  expected,
  raw,
  valid,
  difference,
  saving,
  onChangeRaw,
  onSubmit,
  onClose,
}: CloseRegisterModalViewProps) {
  return (
    <SModal title="Fechar caixa (conferência — BR-06)" onClose={onClose} width={400}>
      <div className="s-kv">
        <span>Dinheiro esperado na gaveta</span>
        <b>{formatBRL(expected)}</b>
      </div>
      <div className="s-label mt-2.5">Saldo contado (R$)</div>
      <div className="s-input">
        <input
          autoFocus
          value={raw}
          onChange={(e) => onChangeRaw(e.target.value)}
          placeholder="0,00"
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit()}
        />
      </div>
      {difference !== null ? (
        <div className="s-kv is-troco mt-2">
          <span>Diferença</span>
          <b className={difference === 0 ? 'text-[color:var(--ok)]' : difference < 0 ? 'text-[color:var(--danger)]' : undefined}>
            {formatBRL(difference)}
          </b>
        </div>
      ) : null}
      <div className="flex gap-2 justify-end mt-3.5">
        <SBtn ghost onClick={onClose}>Voltar</SBtn>
        <SBtn primary disabled={!valid || saving} onClick={onSubmit}>
          Fechar caixa
        </SBtn>
      </div>
    </SModal>
  );
}
