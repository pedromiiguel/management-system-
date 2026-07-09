import { useHotkey } from '@tanstack/react-hotkeys';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PaymentMethod, PAYMENT_METHOD_LABELS, type DiscountInput } from '@beverage/shared';
import { Screen } from '../_app';
import {
  SBtn,
  SCard,
  SChip,
  SKbd,
  SModal,
  SolIcon,
  STable,
  STag,
  SToggle,
  useToast,
} from '../../components/sol';
import { api, apiErrorMessage } from '../../lib/api';
import { getUser } from '../../lib/auth';
import { formatBRL, formatDateTime, maskBRL, parseMoney } from '../../lib/format';
import type { Customer, Product, Sale } from '../../lib/types';

export const Route = createFileRoute('/_app/pos')({
  component: PosPage,
});

type Modal =
  | { kind: 'none' }
  | { kind: 'search' }
  | { kind: 'quantity' }
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
  const [withInvoice, setWithInvoice] = useState(false);
  const [received, setReceived] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [modal, setModal] = useState<Modal>({ kind: 'none' });

  const focusScan = useCallback(() => {
    requestAnimationFrame(() => scanRef.current?.focus());
  }, []);

  const resetCheckout = useCallback(() => {
    setPayment(PaymentMethod.CASH);
    setWithInvoice(false);
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
    onError: (error) => {
      toast(apiErrorMessage(error), 'danger');
      focusScan();
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      (await api.patch<{ sale: Sale; warning: string | null }>(
        `/sales/${sale!.id}/items/${itemId}`,
        { quantity },
      )).data,
    onSuccess: ({ sale: updated, warning }) => {
      setSale(updated);
      if (warning) toast(warning, 'warn');
      focusScan();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

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
  const receivedValue = parseMoney(received);
  const change =
    payment === PaymentMethod.CASH && Number.isFinite(receivedValue)
      ? receivedValue - total
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

  function finalize() {
    if (!sale || items.length === 0) {
      toast('Adicione itens antes de finalizar', 'warn');
      return;
    }
    if (payment === PaymentMethod.CASH) {
      if (!Number.isFinite(receivedValue) || receivedValue < total) {
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
  useHotkey('F3', () => selected && setModal({ kind: 'quantity' }), hk);
  useHotkey('F4', () => setModal({ kind: 'discount' }), hk);
  useHotkey('F5', () => setPayment(PaymentMethod.CASH), hk);
  useHotkey('F6', () => setPayment(PaymentMethod.PIX), hk);
  useHotkey('F7', () => setPayment(PaymentMethod.CARD), hk);
  useHotkey('F8', () => setModal({ kind: 'customer' }), hk);
  useHotkey('F10', finalize, hk);
  useHotkey(
    'Delete',
    () => selected && removeItem.mutate(selected.id),
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
          <div className="s-scan">
            <SolIcon name="scan" size={22} />
            <input
              ref={scanRef}
              autoFocus
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitScan();
                }
              }}
              placeholder="Passe o código de barras ou digite o nome / SKU…"
            />
            <SKbd>F2</SKbd>
          </div>

          <SCard pad={8} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
            <STable
              cols={['#', 'Produto', 'Qtd', 'Unit.', 'Subtotal']}
              widths="40px 1fr 70px 100px 110px"
              align={[null, null, 'center', 'right', 'right']}
              emptyText="Bipe o primeiro produto para começar a venda"
              rows={items.map((item, index) => ({
                key: item.id,
                highlight: item.id === lastAddedId,
                onClick: () => setSelectedId(item.id),
                cells: [
                  index + 1,
                  <span key="n" style={{ fontWeight: item.id === selected?.id ? 700 : 400 }}>
                    {item.product.name}
                  </span>,
                  item.quantity,
                  formatBRL(item.unitPrice),
                  <b key="s">{formatBRL(item.unitPrice * item.quantity)}</b>,
                ],
              }))}
            />
            <div style={{ flex: 1 }} />
            <div className="s-dim" style={{ fontSize: 12, padding: '8px 10px' }}>
              Bipar o mesmo produto soma a quantidade · <b>Del</b> remove o item selecionado
            </div>
          </SCard>

          <div className="s-strip">
            <span><SKbd>F2</SKbd> buscar</span>
            <span><SKbd>F3</SKbd> quantidade</span>
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
            <div className="s-total">{formatBRL(total)}</div>
            <div className="s-dim" style={{ fontSize: 13 }}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {items.length}{' '}
              {items.length === 1 ? 'produto' : 'produtos'}
            </div>
          </SCard>

          <SCard pad={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Desconto</span>
              <span className="s-dim" style={{ fontSize: 13 }}>
                {sale?.discountValue
                  ? sale.discountType === 'PERCENT'
                    ? `${sale.discountValue}%`
                    : formatBRL(sale.discountValue)
                  : '—'}{' '}
                <SKbd>F4</SKbd>
              </span>
            </div>
            <div className="s-divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5 }}>Emitir nota fiscal</span>
              <SToggle on={withInvoice} onChange={setWithInvoice} />
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
                    style={{ textAlign: 'right', fontWeight: 700 }}
                    onKeyDown={(e) => e.key === 'Enter' && finalize()}
                  />
                </span>
              </div>
              <div className="s-kv is-troco">
                <span>Troco</span>
                <b>{change !== null && change >= 0 ? formatBRL(change) : '—'}</b>
              </div>
            </SCard>
          )}

          {payment === PaymentMethod.CREDIT && (
            <SCard pad={12}>
              <div className="s-kv">
                <span>Cliente</span>
                <b>{customer?.name ?? '—'}</b>
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
      {modal.kind === 'quantity' && selected && (
        <QuantityModal
          item={selected.product.name}
          initial={selected.quantity}
          onSubmit={(quantity) => {
            updateItem.mutate({ itemId: selected.id, quantity });
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
          onSubmit={(discount) => setDiscount.mutate(discount)}
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
            <SBtn danger onClick={() => cancelSale.mutate()}>Cancelar venda</SBtn>
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

function SearchModal({ onPick, onClose }: { onPick: (p: Product) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
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

function QuantityModal({
  item,
  initial,
  onSubmit,
  onClose,
}: {
  item: string;
  initial: number;
  onSubmit: (quantity: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(initial));
  const quantity = Number(value);
  const valid = Number.isInteger(quantity) && quantity > 0;
  return (
    <SModal title={`Quantidade — ${item}`} onClose={onClose} width={380}>
      <div className="s-input">
        <input
          autoFocus
          type="number"
          min={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit(quantity)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <SBtn ghost onClick={onClose}>Voltar</SBtn>
        <SBtn primary disabled={!valid} onClick={() => onSubmit(quantity)}>Aplicar</SBtn>
      </div>
    </SModal>
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

function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <SModal title="Venda concluída ✓" onClose={onClose} width={420}>
      <div className="s-receipt">
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <b>DISTRIBUIDORA SOL</b>
          <div className="s-dim" style={{ fontSize: 12 }}>
            Comprovante de venda — {sale.withInvoice ? 'com NF' : 'sem NF'}
          </div>
          <div className="s-dim" style={{ fontSize: 12 }}>
            #{sale.id.slice(-6).toUpperCase()} · {formatDateTime(sale.completedAt)}
          </div>
        </div>
        <STable
          cols={['Produto', 'Qtd', 'Total']}
          widths="1fr 50px 90px"
          align={[null, 'center', 'right']}
          dense
          rows={sale.items.map((i) => ({
            key: i.id,
            cells: [i.product.name, i.quantity, formatBRL(i.unitPrice * i.quantity)],
          }))}
        />
        <div className="s-divider" />
        {sale.discountValue ? (
          <div className="s-kv">
            <span>Desconto</span>
            <b>
              {sale.discountType === 'PERCENT'
                ? `${sale.discountValue}%`
                : formatBRL(sale.discountValue)}
            </b>
          </div>
        ) : null}
        <div className="s-kv">
          <span>Total</span>
          <b style={{ fontSize: 17 }}>{formatBRL(sale.total)}</b>
        </div>
        <div className="s-kv">
          <span>Pagamento</span>
          <b>{sale.paymentMethod ? PAYMENT_METHOD_LABELS[sale.paymentMethod] : '—'}</b>
        </div>
        {sale.change !== null && (
          <>
            <div className="s-kv">
              <span>Recebido</span>
              <b>{formatBRL(sale.amountPaid)}</b>
            </div>
            <div className="s-kv is-troco">
              <span>Troco</span>
              <b>{formatBRL(sale.change)}</b>
            </div>
          </>
        )}
        {sale.customer && (
          <div className="s-kv">
            <span>Cliente</span>
            <b>{sale.customer.name}</b>
          </div>
        )}
      </div>
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
