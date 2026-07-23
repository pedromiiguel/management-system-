import { useCallback, useState } from 'react';
import type { AddSaleItemInput, CompleteSaleInput, DiscountInput, Sale } from '@/domain/models/sale';
import {
  useAddSaleItemMutation,
  useCancelSaleMutation,
  useCompleteSaleMutation,
  useDeleteSaleItemMutation,
  useOpenSaleMutation,
  useSetSaleDiscountMutation,
  useUpdateSaleItemQuantityMutation,
} from '@/main/factories/mutations/sale';

/**
 * Composition root do PDV (ADR 0003): junta as mutations em torno do ciclo de
 * vida da venda (Sale) num único objeto. Não decide nada de UI — foco do
 * scanner, debounce de quantidade, toasts e estado de formulário de checkout
 * continuam em presentation/flows/sale/, que reage ao resultado de cada chamada.
 */
export function useSaleFlow() {
  const [sale, setSale] = useState<Sale | null>(null);

  const openSaleMutation = useOpenSaleMutation();
  const addItemMutation = useAddSaleItemMutation();
  const updateItemQuantityMutation = useUpdateSaleItemQuantityMutation();
  const deleteItemMutation = useDeleteSaleItemMutation();
  const setDiscountMutation = useSetSaleDiscountMutation();
  const cancelSaleMutation = useCancelSaleMutation();
  const completeSaleMutation = useCompleteSaleMutation();

  const requireSale = useCallback(() => {
    if (!sale) throw new Error('Nenhuma venda em andamento');
    return sale;
  }, [sale]);

  const openSale = useCallback(async () => {
    const opened = await openSaleMutation.mutateAsync();
    setSale(opened);
    return opened;
  }, [openSaleMutation]);

  const addItem = useCallback(
    async (input: AddSaleItemInput) => {
      const current = requireSale();
      const result = await addItemMutation.mutateAsync({ saleId: current.id, input });
      setSale(result.sale);
      return result;
    },
    [requireSale, addItemMutation],
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const current = requireSale();
      const result = await updateItemQuantityMutation.mutateAsync({
        saleId: current.id,
        itemId,
        input: { quantity },
      });
      setSale(result.sale);
      return result;
    },
    [requireSale, updateItemQuantityMutation],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const current = requireSale();
      const updated = await deleteItemMutation.mutateAsync({ saleId: current.id, itemId });
      setSale(updated);
      return updated;
    },
    [requireSale, deleteItemMutation],
  );

  const setDiscount = useCallback(
    async (discount: DiscountInput | null) => {
      const current = requireSale();
      const updated = await setDiscountMutation.mutateAsync({ saleId: current.id, discount });
      setSale(updated);
      return updated;
    },
    [requireSale, setDiscountMutation],
  );

  // Cancelar reabre a venda na hora (FR-21) — comportamento original de pos.tsx.
  const cancelSale = useCallback(async () => {
    const current = requireSale();
    await cancelSaleMutation.mutateAsync(current.id);
    setSale(null);
    const reopened = await openSaleMutation.mutateAsync();
    setSale(reopened);
    return reopened;
  }, [requireSale, cancelSaleMutation, openSaleMutation]);

  const completeSale = useCallback(
    async (input: CompleteSaleInput) => {
      const current = requireSale();
      const completed = await completeSaleMutation.mutateAsync({ saleId: current.id, input });
      setSale(null);
      return completed;
    },
    [requireSale, completeSaleMutation],
  );

  return {
    sale,
    openSale,
    addItem,
    updateItemQuantity,
    deleteItem,
    setDiscount,
    cancelSale,
    completeSale,
    isAddingItem: addItemMutation.isPending,
    isCompletingSale: completeSaleMutation.isPending,
  };
}
