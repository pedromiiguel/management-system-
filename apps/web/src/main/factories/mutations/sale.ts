import { useMutation } from '@tanstack/react-query';
import type { AddSaleItemInput, CompleteSaleInput, DiscountInput, UpdateSaleItemInput } from '@/domain/models/sale';
import {
  makeAddSaleItem,
  makeCancelSale,
  makeCompleteSale,
  makeCreateCustomer,
  makeDeleteSaleItem,
  makeOpenSale,
  makeSetSaleDiscount,
  makeUpdateSaleItemQuantity,
} from '@/main/factories/handlers/sale';

export function useOpenSaleMutation() {
  return useMutation({ mutationFn: () => makeOpenSale().open() });
}

export function useAddSaleItemMutation() {
  return useMutation({
    mutationFn: ({ saleId, input }: { saleId: string; input: AddSaleItemInput }) =>
      makeAddSaleItem().add(saleId, input),
  });
}

export function useUpdateSaleItemQuantityMutation() {
  return useMutation({
    mutationFn: ({ saleId, itemId, input }: { saleId: string; itemId: string; input: UpdateSaleItemInput }) =>
      makeUpdateSaleItemQuantity().update(saleId, itemId, input),
  });
}

export function useDeleteSaleItemMutation() {
  return useMutation({
    mutationFn: ({ saleId, itemId }: { saleId: string; itemId: string }) =>
      makeDeleteSaleItem().delete(saleId, itemId),
  });
}

export function useSetSaleDiscountMutation() {
  return useMutation({
    mutationFn: ({ saleId, discount }: { saleId: string; discount: DiscountInput | null }) =>
      makeSetSaleDiscount().set(saleId, discount),
  });
}

export function useCancelSaleMutation() {
  return useMutation({ mutationFn: (saleId: string) => makeCancelSale().cancel(saleId) });
}

export function useCompleteSaleMutation() {
  return useMutation({
    mutationFn: ({ saleId, input }: { saleId: string; input: CompleteSaleInput }) =>
      makeCompleteSale().complete(saleId, input),
  });
}

export function useCreateCustomerMutation() {
  return useMutation({ mutationFn: (name: string) => makeCreateCustomer().create(name) });
}
