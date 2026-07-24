import { PAYMENT_METHOD_LABELS } from '@beverage/shared';
import { SBtn, SCard, STable, STag } from '@/components/sol';
import { formatBRL, formatDateTime } from '@/lib/format';
import { CashMoveModal } from './components/CashMoveModal';
import { CloseRegisterModal } from './components/CloseRegisterModal';
import { MoneyPromptModal } from './components/MoneyPromptModal';
import type { RegisterTabViewProps } from './RegisterTab.types';

export function RegisterTabView({
  register,
  movementRows,
  historyRows,
  modal,
  onOpenModal,
  onCloseModal,
  onOpenRegister,
  onMoved,
  onClosed,
}: RegisterTabViewProps) {
  return (
    <div className="grid grid-cols-[1fr_350px] gap-3 flex-1 min-h-0">
      <SCard pad={8} className="min-h-0 overflow-auto">
        <div className="flex justify-between items-center px-2.5 pt-2 pb-1">
          <div className="s-card-title m-0">
            {register ? 'Movimentos do turno' : 'Fechamentos anteriores'}
          </div>
          <div className="flex gap-2">
            {register ? (
              <>
                <SBtn ghost onClick={() => onOpenModal('move')}>Sangria / Suprimento</SBtn>
                <SBtn primary onClick={() => onOpenModal('close')}>Fechar caixa</SBtn>
              </>
            ) : (
              <SBtn primary onClick={() => onOpenModal('open')}>Abrir caixa</SBtn>
            )}
          </div>
        </div>
        {register ? (
          <STable
            cols={['Hora', 'Descrição', 'Tipo', 'Forma', 'Valor']}
            widths="90px 1fr 110px 90px 100px"
            align={[null, null, null, null, 'right']}
            dense
            emptyText="Nenhum movimento no turno"
            rows={movementRows}
          />
        ) : (
          <STable
            cols={['Abertura', 'Fechamento', 'Operador', 'Esperado', 'Contado', 'Diferença']}
            widths="110px 110px 1fr 100px 100px 100px"
            align={[null, null, null, 'right', 'right', 'right']}
            dense
            emptyText="Nenhum fechamento registrado"
            rows={historyRows}
          />
        )}
      </SCard>

      <div className="flex flex-col gap-3">
        <SCard>
          <div className="s-card-title">Situação do caixa</div>
          {register ? (
            <>
              <div className="s-kv"><span>Status</span><STag tone="ok">aberto</STag></div>
              <div className="s-kv"><span>Operador</span><b>{register.operator.name}</b></div>
              <div className="s-kv"><span>Abertura</span><b>{formatDateTime(register.openedAt)}</b></div>
              <div className="s-kv"><span>Saldo inicial</span><b>{formatBRL(register.openingBalance)}</b></div>
              <div className="s-divider" />
              <div className="s-kv"><span>Sangrias</span><b>−{formatBRL(register.summary?.pulls)}</b></div>
              <div className="s-kv"><span>Suprimentos</span><b>+{formatBRL(register.summary?.floats)}</b></div>
              <div className="s-kv is-troco">
                <span>Dinheiro esperado na gaveta</span>
                <b>{formatBRL(register.summary?.expectedCash)}</b>
              </div>
            </>
          ) : (
            <div className="s-dim text-[13px]">
              Caixa fechado. Abra o caixa para receber vendas em dinheiro.
            </div>
          )}
        </SCard>
        {register?.summary ? (
          <SCard>
            <div className="s-card-title">Recebido no turno (por forma)</div>
            {Object.entries(register.summary.inflowsByMethod).map(([method, value]) => (
              <div key={method} className="s-kv">
                <span>{PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}</span>
                <b>{formatBRL(value)}</b>
              </div>
            ))}
            {Object.keys(register.summary.inflowsByMethod).length === 0 ? (
              <div className="s-dim text-xs">Nenhum recebimento ainda.</div>
            ) : null}
          </SCard>
        ) : null}
      </div>

      {modal === 'open' ? (
        <MoneyPromptModal
          title="Abrir caixa"
          label="Saldo inicial / troco (R$)"
          submitLabel="Abrir caixa"
          onSubmit={onOpenRegister}
          onClose={onCloseModal}
        />
      ) : null}
      {modal === 'move' ? <CashMoveModal onDone={onMoved} onClose={onCloseModal} /> : null}
      {modal === 'close' && register ? (
        <CloseRegisterModal
          expected={Number(register.summary?.expectedCash ?? 0)}
          onDone={onClosed}
          onClose={onCloseModal}
        />
      ) : null}
    </div>
  );
}
