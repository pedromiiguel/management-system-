import { useHotkey } from '@tanstack/react-hotkeys';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import axios from 'axios';
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentMethod, SERVICE_FEE_RATE, type DiscountInput } from '@beverage/shared';
import { Screen } from '../_app';
import {
  SBtn,
  SCard,
  SChip,
  SIconBtn,
  SKbd,
  SModal,
  SolIcon,
  STable,
  STag,
  SToggle,
  useToast,
} from '../../components/sol';
import { Confirm } from '../../components/confirm';
import { api, apiErrorMessage } from '../../lib/api';
import { getUser } from '../../lib/auth';
import { buildCupom, STORE } from '../../lib/cupom';
import { formatBRL, maskBRL, parseMoney } from '../../lib/format';
import type { Customer, Product, Sale, SaleItem } from '../../lib/types';

export const Route = createFileRoute('/_app/pos')({
  component: PosPage,
});


type Modal =
  | { kind: 'none' }
  | { kind: 'search'; initialQuery?: string }
  | { kind: 'discount' }
  | { kind: 'customer' }
  | { kind: 'confirm-cancel' }
  | { kind: 'receipt'; sale: Sale };

function PosPage() {
  const toast = useToast();
  const user = getUser();
  const scanRef = useRef<HTMLInputElement>(null);

  const [sale, setSale] = useState<Sale | null>(null);
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

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => scanRef.current?.focus());
  }, []);

  // Autocomplete por nome/SKU (FR-11) — debounce simples para não disparar 1 request por tecla.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedScan(scan.trim()), 200);
    return () => clearTimeout(id);
  }, [scan]);

  const { data: suggestData } = useQuery({
    queryKey: ['products', 'suggest', debouncedScan],
    queryFn: async () =>
      (await api.get<{ items: Product[] }>('/products', { params: { search: debouncedScan, perPage: 6 } })).data,
    enabled: debouncedScan.length >= 2,
  });
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

  // FR-09: abre (ou retoma) a venda em andamento
  const openSale = useMutation({
    mutationFn: async () => (await api.post<Sale>('/sales')).data,
    onSuccess: (data) => {
      setSale(data);
      focusScan();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });
  const openSaleRef = useRef(openSale.mutate);
  openSaleRef.current = openSale.mutate;
  useEffect(() => {
    openSaleRef.current();
  }, []);

  // FR-10/11/12: adiciona item por código (scanner ou busca)
  const addItem = useMutation({
    mutationFn: async (input: { code: string; quantity?: number }) =>
      (await api.post<{ sale: Sale; warning: string | null }>(`/sales/${sale!.id}/items`, input))
        .data,
    onSuccess: ({ sale: updated, warning }, input) => {
      setSale(updated);
      const added = updated.items.find(
        (i) =>
          i.product.ean === input.code || i.product.sku === input.code || i.productId === input.code,
      );
      setLastAddedId(added?.id ?? null);
      setSelectedId(added?.id ?? null);
      if (warning) toast(warning, 'warn');
      focusScan();
    },
    onError: (error, input) => {
      // Código sem match exato (EAN/SKU/id) — cai para a busca por nome (FR-11).
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setScan('');
        setModal({ kind: 'search', initialQuery: input.code });
        return;
      }
      toast(apiErrorMessage(error), 'danger');
      focusScan();
    },
  });

  // Alterar quantidade (stepper/input da coluna Qtd) — sem foco automático no
  // scan: o operador pode estar clicando +/- várias vezes seguidas.
  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      (await api.patch<{ sale: Sale; warning: string | null }>(
        `/sales/${sale!.id}/items/${itemId}`,
        { quantity },
      )).data,
    onSuccess: ({ sale: updated, warning }) => {
      setSale(updated);
      if (warning) toast(warning, 'warn');
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  // Estado otimista da quantidade por item: mostra o clique/digitação na hora
  // e só sincroniza com o servidor depois de um debounce (evita 1 request por
  // clique quando o operador está zerando uma quantidade grande).
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const qtyPending = useRef<Record<string, { quantity: number; timer: ReturnType<typeof setTimeout> }>>({});

  const commitQuantity = useCallback(
    (itemId: string, quantity: number) => {
      delete qtyPending.current[itemId];
      updateItem.mutate(
        { itemId, quantity },
        {
          onSettled: () =>
            setPendingQty((prev) => {
              if (!(itemId in prev)) return prev;
              const next = { ...prev };
              delete next[itemId];
              return next;
            }),
        },
      );
    },
    [updateItem],
  );

  const scheduleQuantity = useCallback(
    (item: SaleItem, quantity: number) => {
      if (quantity < 1) return;
      const existing = qtyPending.current[item.id];
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => commitQuantity(item.id, quantity), 400);
      qtyPending.current[item.id] = { quantity, timer };
      setPendingQty((prev) => ({ ...prev, [item.id]: quantity }));
    },
    [commitQuantity],
  );

  // +/- lê o último valor gravado no ref (síncrono) em vez da prop do último
  // render — cliques disparados antes do React re-renderizar (ex: duplo clique
  // rápido) não pisam um no outro.
  const stepQuantity = useCallback(
    (item: SaleItem, delta: number) => {
      const current = qtyPending.current[item.id]?.quantity ?? item.quantity;
      scheduleQuantity(item, current + delta);
    },
    [scheduleQuantity],
  );

  // Dispara na hora qualquer alteração de quantidade ainda no debounce — chamado
  // antes de finalizar, remover item, cancelar ou aplicar desconto, pra nunca
  // mudar o estado da venda com uma quantidade que a tela mostrou mas o
  // servidor ainda não confirmou.
  const flushPendingQuantity = useCallback(() => {
    for (const [itemId, { quantity, timer }] of Object.entries(qtyPending.current)) {
      clearTimeout(timer);
      commitQuantity(itemId, quantity);
    }
  }, [commitQuantity]);

  const removeItem = useMutation({
    mutationFn: async (itemId: string) =>
      (await api.delete<Sale>(`/sales/${sale!.id}/items/${itemId}`)).data,
    onSuccess: (updated) => {
      setSale(updated);
      setSelectedId(updated.items.at(-1)?.id ?? null);
      focusScan();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  // Remover item (botão da linha ou atalho Del) — sempre pede confirmação.
  const handleRemove = useCallback(
    async (item: SaleItem) => {
      flushPendingQuantity();
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
      if (confirmed) removeItem.mutate(item.id);
    },
    [removeItem, flushPendingQuantity],
  );

  const setDiscount = useMutation({
    mutationFn: async (discount: DiscountInput | null) =>
      (await api.put<Sale>(`/sales/${sale!.id}/discount`, discount)).data,
    onSuccess: (updated) => {
      setSale(updated);
      setModal({ kind: 'none' });
      focusScan();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  // FR-21: cancela a venda em andamento
  const cancelSale = useMutation({
    mutationFn: async () => (await api.post(`/sales/${sale!.id}/cancel`)).data,
    onSuccess: () => {
      setSale(null);
      resetCheckout();
      setModal({ kind: 'none' });
      openSale.mutate();
      toast('Venda cancelada');
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  // FR-20/BR-07: conclusão atômica
  const completeSale = useMutation({
    mutationFn: async () => {
      const body = {
        paymentMethod: payment,
        withInvoice,
        serviceFee,
        ...(payment === PaymentMethod.CASH ? { amountPaid: parseMoney(received) } : {}),
        ...(payment === PaymentMethod.CREDIT ? { customerId: customer?.id } : {}),
      };
      return (await api.post<Sale>(`/sales/${sale!.id}/complete`, body)).data;
    },
    onSuccess: (completed) => {
      setModal({ kind: 'receipt', sale: completed });
      setSale(null);
      resetCheckout();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const items = sale?.items ?? [];
  const total = sale?.total ?? 0;
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  // Taxa de serviço (10% do subtotal, pré-desconto) exibida localmente; o
  // backend recalcula com Decimal na conclusão (fonte da verdade).
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const feeValue = serviceFee ? Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100 : 0;
  const displayTotal = total + feeValue;
  const receivedValue = parseMoney(received);
  const change =
    payment === PaymentMethod.CASH && Number.isFinite(receivedValue)
      ? receivedValue - displayTotal
      : null;
  const selected = items.find((i) => i.id === selectedId) ?? items.at(-1) ?? null;
  const busy = addItem.isPending || completeSale.isPending;

  function submitScan() {
    const code = scan.trim();
    if (!code || !sale || busy) return;
    // Atalho de quantidade do balcão: "3*7891..." ou "3x7891..."
    const match = /^(\d{1,3})[*xX](.+)$/.exec(code);
    addItem.mutate(
      match ? { code: match[2]!.trim(), quantity: Number(match[1]) } : { code },
    );
    setScan('');
  }

  function pickSuggestion(product: Product) {
    if (!sale || busy) return;
    addItem.mutate({ code: product.id });
    setScan('');
    setActiveSuggestion(0);
  }

  function finalize() {
    flushPendingQuantity();
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
    completeSale.mutate();
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
          {sale && (
            <STag tone="accent">Venda #{sale.id.slice(-6).toUpperCase()} em andamento</STag>
          )}
          <STag tone="dim">Operador: {user?.name ?? '—'}</STag>
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
                onChange={(e) => {
                  setScan(e.target.value);
                  setActiveSuggestion(0);
                }}
                onKeyDown={(e) => {
                  if (suggestOpen && e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
                    return;
                  }
                  if (suggestOpen && e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSuggestion((i) => Math.max(i - 1, 0));
                    return;
                  }
                  if (suggestOpen && e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setScan('');
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (suggestOpen) pickSuggestion(suggestions[highlighted]!);
                    else submitScan();
                  }
                }}
                placeholder="Passe o código de barras ou digite o nome / SKU…"
              />
              <SKbd>F2</SKbd>
            </div>
            {suggestOpen && (
              <div className="s-suggest" role="listbox" aria-label="Sugestões de produto">
                {suggestions.map((p, i) => (
                  <div
                    key={p.id}
                    role="option"
                    aria-selected={i === highlighted}
                    className={clsx('s-suggest-item', i === highlighted && 'is-active')}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(p)}
                  >
                    <span>{p.name}</span>
                    <span className="s-dim" style={{ fontSize: 12 }}>
                      {formatBRL(p.salePrice)} · estoque {p.currentStock}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                        flushPendingQuantity();
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
                      onClick={(e) => {
                        e.stopPropagation();
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
            <div className="s-total" data-testid="pos-total">{formatBRL(displayTotal)}</div>
            <div className="s-dim" style={{ fontSize: 13 }}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {items.length}{' '}
              {items.length === 1 ? 'produto' : 'produtos'}
            </div>
          </SCard>

          <SCard pad={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Desconto</span>
              <span className="s-dim" style={{ fontSize: 13 }}>
                <span data-testid="pos-discount-value">
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
                {serviceFee && (
                  <span className="s-dim" style={{ fontSize: 13 }} data-testid="pos-service-fee-value">
                    {formatBRL(feeValue)}
                  </span>
                )}
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

          {payment === PaymentMethod.CASH && (
            <SCard pad={12}>
              <div className="s-kv">
                <span>Recebido</span>
                <span className="s-input" style={{ width: 120, padding: '4px 10px' }}>
                  <input
                    value={received}
                    onChange={(e) => setReceived(maskBRL(e.target.value))}
                    inputMode="numeric"
                    placeholder="0,00"
                    aria-label="Valor recebido"
                    style={{ textAlign: 'right', fontWeight: 700 }}
                    onKeyDown={(e) => e.key === 'Enter' && finalize()}
                  />
                </span>
              </div>
              <div className="s-kv is-troco">
                <span>Troco</span>
                <b data-testid="pos-change">{change !== null && change >= 0 ? formatBRL(change) : '—'}</b>
              </div>
            </SCard>
          )}

          {payment === PaymentMethod.CREDIT && (
            <SCard pad={12}>
              <div className="s-kv">
                <span>Cliente</span>
                <b data-testid="pos-selected-customer">{customer?.name ?? '—'}</b>
              </div>
              <SBtn ghost style={{ width: '100%', marginTop: 6 }} onClick={() => setModal({ kind: 'customer' })}>
                {customer ? 'Trocar cliente' : 'Selecionar cliente'}
              </SBtn>
            </SCard>
          )}

          <div style={{ flex: 1 }} />
          <SBtn primary big kbd="F10" onClick={finalize} disabled={completeSale.isPending}>
            {completeSale.isPending ? 'Finalizando…' : 'Finalizar venda'}
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

      {modal.kind === 'search' && (
        <SearchModal
          initialQuery={modal.initialQuery}
          onPick={(product) => {
            addItem.mutate({ code: product.id });
            setModal({ kind: 'none' });
          }}
          onClose={() => {
            setModal({ kind: 'none' });
            focusScan();
          }}
        />
      )}
      {modal.kind === 'discount' && (
        <DiscountModal
          onSubmit={(discount) => {
            flushPendingQuantity();
            setDiscount.mutate(discount);
          }}
          onClose={() => {
            setModal({ kind: 'none' });
            focusScan();
          }}
        />
      )}
      {modal.kind === 'customer' && (
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
      )}
      {modal.kind === 'confirm-cancel' && (
        <SModal title="Cancelar venda em andamento?" onClose={() => setModal({ kind: 'none' })}>
          <div className="s-dim" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Os itens bipados serão descartados. Nenhum estoque ou valor foi movimentado (FR-21).
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => setModal({ kind: 'none' })}>Voltar</SBtn>
            <SBtn
              danger
              onClick={() => {
                flushPendingQuantity();
                cancelSale.mutate();
              }}
            >
              Cancelar venda
            </SBtn>
          </div>
        </SModal>
      )}
      {modal.kind === 'receipt' && (
        <ReceiptModal
          sale={modal.sale}
          onClose={() => {
            setModal({ kind: 'none' });
            openSale.mutate();
          }}
        />
      )}
    </Screen>
  );
}

// ---------- Modais do PDV ----------

function SearchModal({
  initialQuery,
  onPick,
  onClose,
}: {
  initialQuery?: string;
  onPick: (p: Product) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState(initialQuery ?? '');
  const { data } = useQuery({
    queryKey: ['products', 'search', search],
    queryFn: async () =>
      (await api.get<{ items: Product[] }>('/products', { params: { search, perPage: 8 } })).data,
    enabled: search.length >= 2,
  });
  const results = data?.items ?? [];

  return (
    <SModal title="Buscar produto (F2)" onClose={onClose} width={480}>
      <div className="s-input" style={{ marginBottom: 10 }}>
        <SolIcon name="search" size={15} />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, SKU ou código de barras…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) onPick(results[0]);
          }}
        />
      </div>
      <STable
        cols={['Produto', 'Estoque', 'Preço']}
        widths="1fr 70px 90px"
        align={[null, 'center', 'right']}
        dense
        emptyText={search.length >= 2 ? 'Nada encontrado' : 'Digite ao menos 2 caracteres'}
        rows={results.map((p) => ({
          key: p.id,
          onClick: () => onPick(p),
          cells: [
            p.name,
            p.currentStock,
            formatBRL(p.salePrice),
          ],
        }))}
      />
    </SModal>
  );
}

// Alterar quantidade de um item já na venda (FR-14) — +/- ou digitação direta,
// sem precisar rebipar o produto. Ver CONTEXT.md ("Alterar quantidade").
function QtyStepper({
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
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0) onTyped(n);
    else setRaw(String(quantity));
  };

  return (
    <div className="s-qty-stepper" onClick={(e) => e.stopPropagation()}>
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
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, ''))}
        onBlur={() => {
          commitTyped();
          onDone();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <button type="button" onClick={() => onStep(1)} aria-label="Aumentar quantidade">
        +
      </button>
    </div>
  );
}

function DiscountModal({
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
          onChange={(e) => setRaw(e.target.value)}
          placeholder={type === 'AMOUNT' ? '0,00' : '0'}
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit({ type, value })}
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

function CustomerModal({
  onPick,
  onClose,
}: {
  onPick: (customer: Customer) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const { data: customers = [], refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () =>
      (await api.get<Customer[]>('/customers', { params: { search } })).data,
  });

  const createCustomer = useMutation({
    mutationFn: async (name: string) =>
      (await api.post<Customer>('/customers', { name })).data,
    onSuccess: (created) => {
      void refetch();
      onPick({ ...created, openBalance: 0 });
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  return (
    <SModal title="Cliente do fiado (F8)" onClose={onClose} width={460}>
      <div className="s-input" style={{ marginBottom: 10 }}>
        <SolIcon name="search" size={15} />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente…"
        />
      </div>
      <STable
        cols={['Nome', 'Em aberto']}
        widths="1fr 110px"
        align={[null, 'right']}
        dense
        emptyText="Nenhum cliente"
        rows={customers.map((c) => ({
          key: c.id,
          onClick: () => onPick(c),
          cells: [c.name, formatBRL(c.openBalance)],
        }))}
      />
      <div className="s-divider" />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="s-input" style={{ flex: 1 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Novo cliente — nome"
          />
        </div>
        <SBtn ghost disabled={newName.trim().length < 2} onClick={() => createCustomer.mutate(newName.trim())}>
          + Cadastrar
        </SBtn>
      </div>
    </SModal>
  );
}

// Cupom não-fiscal (FR-23) — o <pre> exibido é exatamente o texto que vai
// para a impressora térmica de 80mm (ver lib/cupom.ts e o @media print).
function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <SModal title="Venda concluída ✓" onClose={onClose} width={420}>
      <pre className="s-receipt s-cupom">{buildCupom(sale, STORE)}</pre>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <SBtn ghost onClick={() => window.print()}>Imprimir</SBtn>
        <SBtn primary onClick={onClose}>Nova venda (Enter)</SBtn>
      </div>
      <EnterToClose onClose={onClose} />
    </SModal>
  );
}

function EnterToClose({ onClose }: { onClose: () => void }) {
  useHotkey('Enter', onClose, { ignoreInputs: false });
  return null;
}
