import { useHotkey } from '@tanstack/react-hotkeys';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { PaymentMethod, SERVICE_FEE_RATE } from '@beverage/shared';
import type {
  AddSaleItemInput,
  Customer,
  DiscountInput,
  Product,
  SaleItem,
} from '@/domain/models/sale';
import { useSaleFlow } from '@/main/factories/flows/use-sale-flow';
import { useSearchProductsQuery } from '@/main/factories/queries/sale';
import { useToast } from '@/components/sol';
import { Confirm } from '@/components/confirm';
import { apiErrorMessage } from '@/lib/api';
import { formatBRL, maskBRL, parseMoney } from '@/lib/format';
import { useQuantityDebounce } from '../hooks/use-quantity-debounce';
import { useScanFocus } from '../hooks/use-scan-focus';
import type { Modal, SalePageProps } from './SalePage.types';

export function useSalePageModel(operatorName: SalePageProps['operatorName']) {
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
        message: `Remover "${item.product.name}" da venda?`,
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
  useHotkey('Delete', () => selected && void handleRemove(selected), {
    ignoreInputs: false,
    enabled: !modalOpen && scan === '',
  });
  useHotkey(
    'Escape',
    () => {
      if (modalOpen) setModal({ kind: 'none' });
      else if (items.length > 0) setModal({ kind: 'confirm-cancel' });
    },
    { ignoreInputs: false },
  );

  const onScanChange = (value: string) => {
    setScan(value);
    setActiveSuggestion(0);
  };

  const onScanKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
  };

  const discountLabel = sale?.discountValue
    ? sale.discountType === 'PERCENT'
      ? `${sale.discountValue}%`
      : formatBRL(sale.discountValue)
    : '—';

  const saleTag = sale ? `Venda #${sale.id.slice(-6).toUpperCase()} em andamento` : null;

  return {
    operatorName,
    saleTag,
    scanRef,
    scan,
    onScanChange,
    onScanKeyDown,
    suggestOpen,
    suggestions,
    highlighted,
    onPickSuggestion: pickSuggestion,
    items,
    pendingQty,
    lastAddedId,
    selectedItemId: selected?.id ?? null,
    onSelectItem: setSelectedId,
    onStepQuantity: stepQuantity,
    onTypedQuantity: scheduleQuantity,
    onQuantityDone: () => {
      void flushPendingQuantity();
      focusScan();
    },
    onRemoveItem: (item: SaleItem) => void handleRemove(item),
    displayTotal,
    itemCount,
    productCount: items.length,
    discountLabel,
    serviceFee,
    feeValue,
    onToggleServiceFee: setServiceFee,
    withInvoice,
    onToggleInvoice: setWithInvoice,
    payment,
    onSelectPayment: (method: PaymentMethod) => {
      setPayment(method);
      if (method === PaymentMethod.CREDIT && !customer) setModal({ kind: 'customer' });
      focusScan();
    },
    received,
    onReceivedChange: (value: string) => setReceived(maskBRL(value)),
    onReceivedEnter: () => void finalize(),
    change,
    customer,
    onOpenCustomer: () => setModal({ kind: 'customer' }),
    onFinalize: () => void finalize(),
    isCompletingSale,
    onRequestCancel: () => {
      if (items.length > 0) setModal({ kind: 'confirm-cancel' });
    },
    modal,
    onModalClose: () => {
      setModal({ kind: 'none' });
      focusScan();
    },
    onSearchPick: (product: Product) => {
      void handleAddItem({ code: product.id });
      setModal({ kind: 'none' });
    },
    onDiscountSubmit: (discount: DiscountInput | null) => void handleSetDiscount(discount),
    onCustomerPick: (picked: Customer) => {
      setCustomer(picked);
      setPayment(PaymentMethod.CREDIT);
      setModal({ kind: 'none' });
      focusScan();
    },
    onConfirmCancelClose: () => setModal({ kind: 'none' }),
    onCancelSale: () => void handleCancelSale(),
    onReceiptClose: () => {
      setModal({ kind: 'none' });
      void openSaleRef.current();
    },
  };
}

export type SalePageViewModel = ReturnType<typeof useSalePageModel>;
