import { useMutation } from '@tanstack/react-query';
import type { ProductInput, StockEntryInput, UpdateProductInput } from '@/domain/models/products';
import {
  makeCreateProduct,
  makeCreateStockEntry,
  makeDeactivateProduct,
  makeDeleteProduct,
  makeUpdateProduct,
} from '@/main/factories/handlers/products';

export function useCreateProductMutation() {
  return useMutation({ mutationFn: (input: ProductInput) => makeCreateProduct().create(input) });
}

export function useUpdateProductMutation() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      makeUpdateProduct().update(id, input),
  });
}

export function useDeactivateProductMutation() {
  return useMutation({ mutationFn: (id: string) => makeDeactivateProduct().deactivate(id) });
}

export function useDeleteProductMutation() {
  return useMutation({ mutationFn: (id: string) => makeDeleteProduct().delete(id) });
}

export function useCreateStockEntryMutation() {
  return useMutation({ mutationFn: (input: StockEntryInput) => makeCreateStockEntry().create(input) });
}
