import { useHotkey } from '@tanstack/react-hotkeys';
import axios from 'axios';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentMethod, SERVICE_FEE_RATE } from '@beverage/shared';
import type { AddSaleItemInput, Customer, DiscountInput, Product, Sale, SaleItem } from '@/domain/models/sale';
import { useSaleFlow } from '@/main/factories/flows/use-sale-flow';
import { useSearchProductsQuery } from '@/main/factories/queries/sale';
import { SBtn, SCard, SIconBtn, SKbd, SModal, SolIcon, STable, STag, SToggle, useToast } from '../../components/sol';
import { Screen } from '../components/Screen';
import { Confirm } from '../../components/confirm';
import { apiErrorMessage } from '../../lib/api';
import { formatBRL, maskBRL, parseMoney } from '../../lib/format';
import { CustomerModal } from './components/CustomerModal';
import { DiscountModal } from './components/DiscountModal';
import { QtyStepper } from './components/QtyStepper';
import { ReceiptModal } from './components/ReceiptModal';
import { SearchModal } from './components/SearchModal';
import { useQuantityDebounce } from './hooks/use-quantity-debounce';
import { useScanFocus } from './hooks/use-scan-focus';

type Modal =
  | { kind: 'none' }
  | { kind: 'search'; initialQuery?: string }
  | { kind: 'discount' }
  | { kind: 'customer' }
  | { kind: 'confirm-cancel' }
  | { kind: 'receipt'; sale: Sale };

export function SalePage({ operatorName }: { operatorName: string | undefined }) {
  const toast = useToast();
  const { scanRef, focusScan } = useScanFocus();
  const {
    sale,
    openSale,
    addItem,
    updateItemQuantity,
    deleteItem,
    setDiscount,
    cancelSale,
    completeSale,
    isAddingItem,
    isCompletingSale,
  } = useSaleFlow();

  const [scan, setScan] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [withInvoice, setWithInvoice] = useState(true);
  const [serviceFee, setServiceFee] = useState(false);
  const [received, setReceived] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [modal, setModal] = useState<Modal>({ kind: 'none' });
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [debouncedScan, setDebouncedScan] = useState('');

  // Autocomplete por nome/SKU (FR-11) — debounce simples para não disparar 1 request por tecla.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedScan(scan.trim()), 200);
    return () => clearTimeout(id);
  }, [scan]);

  const { data: suggestData } = useSearchProductsQuery(debouncedScan, 6);
  const suggestions = debouncedScan.length >= 2 ? suggestData?.items ?? [] : [];
  const suggestOpen = scan.trim().length >= 2 && suggestions.length > 0;
  const highlighted = Math.min(activeSuggestion, suggestions.length - 1);

  const resetCheckout = useCallback(() => {
    setPayment(PaymentMethod.CASH);
    setWithInvoice(true);
    setServiceFee(false);
    setReceived('');
    setCustomer(null);
    setSelectedId(null);
    setLastAddedId(null);
  }, []);

  const handleOpenSale = useCallback(async () => {
    try {
      await openSale();
      focusScan();
    } catch (error) {
      toast(apiErrorMessage(error), 'danger');
    }
  }, [openSale, focusScan, toast]);

  // FR-09: abre (ou retoma) a venda em andamento
  const openSaleRef = useRef(handleOpenSale);
  openSaleRef.current = handleOpenSale;
  // Guarda contra o duplo-disparo de efeito do StrictMode em dev: sem isso,
  // dois POST /sales concorrentes no mount podem criar duas vendas
  // IN_PROGRESS para o mesmo operador, já que open() não tem lock contra
  // corrida entre o "existe uma em andamento?" e o create.
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    void openSaleRef.current();
  }, []);

  // FR-10/11/12: adiciona item por código (scanner ou busca)
  const handleAddItem = useCallback(
    async (input: AddSaleItemInput) => {
      try {
        const { sale: updated, warning } = await addItem(input);
        const added = updated.items.find(
          (item) =>
            item.product.ean === input.code ||
            item.product.sku === input.code ||
            item.productId === input.code,
        );
        setLastAddedId(added?.id ?? null);
        setSelectedId(added?.id ?? null);
        if (warning) toast(warning, 'warn');
        focusScan();
      } catch (error) {
        // Código sem match exato (EAN/SKU/id) — cai para a busca por nome (FR-11).
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setScan('');
          setModal({ kind: 'search', initialQuery: input.code });
          return;
        }
        toast(apiErrorMessage(error), 'danger');
        focusScan();
      }
    },
    [addItem, toast, focusScan],
  );

  const handleQuantitySuccess = useCallback(
    (warning: string | null) => {
      if (warning) toast(warning, 'warn');
    },
    [toast],
  );
  const handleQuantityError = useCallback(
    (error: unknown) => toast(apiErrorMessage(error), 'danger'),
    [toast],
  );
  const { pendingQty, scheduleQuantity, stepQuantity, flushPendingQuantity } = useQuantityDebounce(
    (itemId, quantity) => updateItemQuantity(itemId, quantity),
    handleQuantitySuccess,
    handleQuantityError,
  );

  // Remover item (botão da linha ou atalho Del) — sempre pede confirmação.
  const handleRemove = useCallback(
    async (item: SaleItem) => {
      await flushPendingQuantity();
      const confirmed = await Confirm.call({
        title: 'Remover item?',
        message: (
          <>
            Remover <b>{item.product.name}</b> da venda?
          </>
        ),
        confirmLabel: 'Remover',
        danger: true,
      });
      if (!confirmed) return;
      try {
        const updated = await deleteItem(item.id);
        setSelectedId(updated.items.at(-1)?.id ?? null);
        focusScan();
      } catch (error) {
        toast(apiErrorMessage(error), 'danger');
      }
    },
    [flushPendingQuantity, deleteItem, focusScan, toast],
  );

  const handleSetDiscount = useCallback(
    async (discount: DiscountInput | null) => {
      await flushPendingQuantity();
      try {
        await setDiscount(discount);
        setModal({ kind: 'none' });
        focusScan();
      } catch (error) {
        toast(apiErrorMessage(error), 'danger');
      }
    },
    [flushPendingQuantity, setDiscount, focusScan, toast],
  );

  // FR-21: cancela a venda em andamento e reabre outra na hora
  const handleCancelSale = useCallback(async () => {
    await flushPendingQuantity();
    try {
      await cancelSale();
      resetCheckout();
      setModal({ kind: 'none' });
      toast('Venda cancelada');
      // flow.cancelSale() já reabre a venda — o foco tem que voltar ao
      // scanner igual acontece em qualquer abertura de venda (ver
      // apps/e2e/tests/support/sale.ts:78).
      focusScan();
    } catch (error) {
      toast(apiErrorMessage(error), 'danger');
    }
  }, [flushPendingQuantity, cancelSale, resetCheckout, toast, focusScan]);

  const items = sale?.items ?? [];
  const total = sale?.total ?? 0;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  // Taxa de serviço (10% do subtotal, pré-desconto) exibida localmente; o
  // backend recalcula com Decimal na conclusão (fonte da verdade).
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const feeValue = serviceFee ? Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100 : 0;
  const displayTotal = total + feeValue;
  const receivedValue = parseMoney(received);
  const change =
    payment === PaymentMethod.CASH && Number.isFinite(receivedValue)
      ? receivedValue - displayTotal
      : null;
  const selected = items.find((item) => item.id === selectedId) ?? items.at(-1) ?? null;
  const busy = isAddingItem || isCompletingSale;

  function submitScan() {
    const code = scan.trim();
    if (!code || !sale || busy) return;
    // Atalho de quantidade do balcão: "3*7891..." ou "3x7891..."
    const match = /^(\d{1,3})[*xX](.+)$/.exec(code);
    void handleAddItem(match ? { code: match[2]!.trim(), quantity: Number(match[1]) } : { code });
    setScan('');
  }

  function pickSuggestion(product: Product) {
    if (!sale || busy) return;
    void handleAddItem({ code: product.id });
    setScan('');
    setActiveSuggestion(0);
  }

  async function finalize() {
    await flushPendingQuantity();
    if (!sale || items.length === 0) {
      toast('Adicione itens antes de finalizar', 'warn');
      return;
    }
    if (payment === PaymentMethod.CASH) {
      if (!Number.isFinite(receivedValue) || receivedValue < displayTotal) {
        toast('Informe o valor recebido (maior ou igual ao total)', 'warn');
        return;
      }
    }
    if (payment === PaymentMethod.CREDIT && !customer) {
      setModal({ kind: 'customer' });
      return;
    }
    const input = {
      paymentMethod: payment,
      withInvoice,
      serviceFee,
      ...(payment === PaymentMethod.CASH ? { amountPaid: receivedValue } : {}),
      ...(payment === PaymentMethod.CREDIT ? { customerId: customer?.id } : {}),
    };
    try {
      const completed = await completeSale(input);
      setModal({ kind: 'receipt', sale: completed });
      resetCheckout();
    } catch (error) {
      toast(apiErrorMessage(error), 'danger');
    }
  }

  const modalOpen = modal.kind !== 'none';

  // Atalhos do PDV (FR-26) — TanStack Hotkeys; ignoreInputs: false porque o
  // campo de scan vive focado (NFR-12: scanner USB emula teclado + Enter)
  const hk = { ignoreInputs: false, enabled: !modalOpen } as const;
  useHotkey('F2', () => setModal({ kind: 'search' }), hk);
  useHotkey('F4', () => setModal({ kind: 'discount' }), hk);
  useHotkey('F5', () => setPayment(PaymentMethod.CASH), hk);
  useHotkey('F6', () => setPayment(PaymentMethod.PIX), hk);
  useHotkey('F7', () => setPayment(PaymentMethod.CARD), hk);
  useHotkey('F8', () => setModal({ kind: 'customer' }), hk);
  useHotkey('F10', finalize, hk);
  useHotkey(
    'Delete',
    () => selected && void handleRemove(selected),
    { ignoreInputs: false, enabled: !modalOpen && scan === '' },
  );
  useHotkey(
    'Escape',
    () => {
      if (modalOpen) setModal({ kind: 'none' });
      else if (items.length > 0) setModal({ kind: 'confirm-cancel' });
    },
    { ignoreInputs: false },
  );

  return (
    <Screen
      title="Frente de Caixa"
      topRight={
        <>
          {sale ? (
            <STag tone="accent">Venda #{sale.id.slice(-6).toUpperCase()} em andamento</STag>
          ) : null}
          <STag tone="dim">Operador: {operatorName ?? '—'}</STag>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 332px', gap: 16, height: '100%' }}>
        {/* Coluna esquerda — scan + itens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
            <div className="s-scan">
              <SolIcon name="scan" size={22} />
              <input
                ref={scanRef}
                autoFocus
                aria-label="Código de barras, SKU ou nome do produto"
                value={scan}
                onChange={(event) => {
                  setScan(event.target.value);
                  setActiveSuggestion(0);
                }}
                onKeyDown={(event) => {
                  if (suggestOpen && event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
                    return;
                  }
                  if (suggestOpen && event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveSuggestion((prev) => Math.max(prev - 1, 0));
                    return;
                  }
                  if (suggestOpen && event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    setScan('');
                    return;
                  }
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    if (suggestOpen) pickSuggestion(suggestions[highlighted]!);
                    else submitScan();
                  }
                }}
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
                    onClick={() => pickSuggestion(product)}
                  >
                    <span>{product.name}</span>
                    <span className="s-dim" style={{ fontSize: 12 }}>
                      {formatBRL(product.salePrice)} · estoque {product.currentStock}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <SCard pad={8} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
            <STable
              cols={['#', 'Produto', 'Qtd', 'Unit.', 'Subtotal', '']}
              widths="40px 1fr 108px 100px 110px 44px"
              align={[null, null, 'center', 'right', 'right', 'center']}
              emptyText="Bipe o primeiro produto para começar a venda"
              rows={items.map((item, index) => {
                const quantity = pendingQty[item.id] ?? item.quantity;
                return {
                  key: item.id,
                  testId: `sale-item-${item.id}`,
                  highlight: item.id === lastAddedId,
                  onClick: () => setSelectedId(item.id),
                  cells: [
                    index + 1,
                    <span key="n" style={{ fontWeight: item.id === selected?.id ? 700 : 400 }}>
                      {item.product.name}
                    </span>,
                    <QtyStepper
                      key="q"
                      quantity={quantity}
                      onStep={(delta) => stepQuantity(item, delta)}
                      onTyped={(next) => scheduleQuantity(item, next)}
                      onDone={() => {
                        void flushPendingQuantity();
                        focusScan();
                      }}
                    />,
                    formatBRL(item.unitPrice),
                    <b key="s" data-testid={`sale-item-${item.id}-subtotal`}>
                      {formatBRL(item.unitPrice * quantity)}
                    </b>,
                    <SIconBtn
                      key="del"
                      icon="trash"
                      danger
                      title="Remover item"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleRemove(item);
                      }}
                    />,
                  ],
                };
              })}
            />
            <div style={{ flex: 1 }} />
            <div className="s-dim" style={{ fontSize: 12, padding: '8px 10px' }}>
              Bipar o mesmo produto soma a quantidade · use +/- ou digite pra alterar a quantidade · <b>Del</b> remove o item selecionado
            </div>
          </SCard>

          <div className="s-strip">
            <span><SKbd>F2</SKbd> buscar</span>
            <span><SKbd>F4</SKbd> desconto</span>
            <span><SKbd>Del</SKbd> remover</span>
            <span><SKbd>F10</SKbd> finalizar</span>
            <span><SKbd>Esc</SKbd> cancelar</span>
          </div>
        </div>

        {/* Coluna direita — checkout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SCard pad={18} style={{ textAlign: 'center' }}>
            <div className="s-stat-label">TOTAL DA VENDA</div>
            <div className="s-total" data-testid="sale-total">{formatBRL(displayTotal)}</div>
            <div className="s-dim" style={{ fontSize: 13 }}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {items.length}{' '}
              {items.length === 1 ? 'produto' : 'produtos'}
            </div>
          </SCard>

          <SCard pad={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Desconto</span>
              <span className="s-dim" style={{ fontSize: 13 }}>
                <span data-testid="sale-discount-value">
                  {sale?.discountValue
                    ? sale.discountType === 'PERCENT'
                      ? `${sale.discountValue}%`
                      : formatBRL(sale.discountValue)
                    : '—'}
                </span>{' '}
                <SKbd>F4</SKbd>
              </span>
            </div>
            <div className="s-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Taxa de serviço (10%)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {serviceFee ? (
                  <span className="s-dim" style={{ fontSize: 13 }} data-testid="sale-service-fee-value">
                    {formatBRL(feeValue)}
                  </span>
                ) : null}
                <SToggle on={serviceFee} onChange={setServiceFee} ariaLabel="Taxa de serviço" />
              </span>
            </div>
            <div className="s-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Emitir nota fiscal</span>
              <SToggle on={withInvoice} onChange={setWithInvoice} ariaLabel="Emitir nota fiscal" />
            </div>
          </SCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(
              [
                [PaymentMethod.CASH, 'Dinheiro', 'F5'],
                [PaymentMethod.PIX, 'PIX', 'F6'],
                [PaymentMethod.CARD, 'Cartão', 'F7'],
                [PaymentMethod.CREDIT, 'Fiado', 'F8'],
              ] as const
            ).map(([method, label, key]) => (
              <button
                key={method}
                className={`s-paytile${payment === method ? ' is-active' : ''}`}
                onClick={() => {
                  setPayment(method);
                  if (method === PaymentMethod.CREDIT && !customer) setModal({ kind: 'customer' });
                  focusScan();
                }}
                type="button"
                aria-label={`Pagamento ${label}`}
                aria-pressed={payment === method}
              >
                <b>{label}</b>
                <SKbd>{key}</SKbd>
              </button>
            ))}
          </div>

          {payment === PaymentMethod.CASH ? (
            <SCard pad={12}>
              <div className="s-kv">
                <span>Recebido</span>
                <span className="s-input" style={{ width: 120, padding: '4px 10px' }}>
                  <input
                    value={received}
                    onChange={(event) => setReceived(maskBRL(event.target.value))}
                    inputMode="numeric"
                    placeholder="0,00"
                    aria-label="Valor recebido"
                    style={{ textAlign: 'right', fontWeight: 700 }}
                    onKeyDown={(event) => event.key === 'Enter' && finalize()}
                  />
                </span>
              </div>
              <div className="s-kv is-troco">
                <span>Troco</span>
                <b data-testid="sale-change">{change !== null && change >= 0 ? formatBRL(change) : '—'}</b>
              </div>
            </SCard>
          ) : null}

          {payment === PaymentMethod.CREDIT ? (
            <SCard pad={12}>
              <div className="s-kv">
                <span>Cliente</span>
                <b data-testid="sale-selected-customer">{customer?.name ?? '—'}</b>
              </div>
              <SBtn ghost style={{ width: '100%', marginTop: 6 }} onClick={() => setModal({ kind: 'customer' })}>
                {customer ? 'Trocar cliente' : 'Selecionar cliente'}
              </SBtn>
            </SCard>
          ) : null}

          <div style={{ flex: 1 }} />
          <SBtn primary big kbd="F10" onClick={finalize} disabled={isCompletingSale}>
            {isCompletingSale ? 'Finalizando…' : 'Finalizar venda'}
          </SBtn>
          <SBtn
            ghost
            danger
            kbd="Esc"
            onClick={() => items.length > 0 && setModal({ kind: 'confirm-cancel' })}
          >
            Cancelar venda
          </SBtn>
        </div>
      </div>

      {modal.kind === 'search' ? (
        <SearchModal
          initialQuery={modal.initialQuery}
          onPick={(product) => {
            void handleAddItem({ code: product.id });
            setModal({ kind: 'none' });
          }}
          onClose={() => {
            setModal({ kind: 'none' });
            focusScan();
          }}
        />
      ) : null}
      {modal.kind === 'discount' ? (
        <DiscountModal
          onSubmit={(discount) => void handleSetDiscount(discount)}
          onClose={() => {
            setModal({ kind: 'none' });
            focusScan();
          }}
        />
      ) : null}
      {modal.kind === 'customer' ? (
        <CustomerModal
          onPick={(picked) => {
            setCustomer(picked);
            setPayment(PaymentMethod.CREDIT);
            setModal({ kind: 'none' });
            focusScan();
          }}
          onClose={() => {
            setModal({ kind: 'none' });
            focusScan();
          }}
        />
      ) : null}
      {modal.kind === 'confirm-cancel' ? (
        <SModal title="Cancelar venda em andamento?" onClose={() => setModal({ kind: 'none' })}>
          <div className="s-dim" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Os itens bipados serão descartados. Nenhum estoque ou valor foi movimentado (FR-21).
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => setModal({ kind: 'none' })}>Voltar</SBtn>
            <SBtn danger onClick={() => void handleCancelSale()}>
              Cancelar venda
            </SBtn>
          </div>
        </SModal>
      ) : null}
      {modal.kind === 'receipt' ? (
        <ReceiptModal
          sale={modal.sale}
          onClose={() => {
            setModal({ kind: 'none' });
            void openSaleRef.current();
          }}
        />
      ) : null}
    </Screen>
  );
}
