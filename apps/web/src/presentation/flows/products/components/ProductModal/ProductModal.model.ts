import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Permission } from '@beverage/shared';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import { hasPermission } from '@/lib/auth';
import type { Product, ProductInput } from '@/domain/models/products';
import {
  useCreateProductMutation,
  useDeactivateProductMutation,
  useUpdateProductMutation,
} from '@/main/factories/mutations/products';
import { productFormSchema, type ProductFormInput } from './ProductModal.schema';

export function useProductModalModel(product: Product | undefined, onSaved: () => void) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canEnterStock = hasPermission(Permission.STOCK_WRITE);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          ean: product.ean ?? '',
          unit: product.unit,
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          minimumStock: product.minimumStock,
          active: product.active,
        }
      : { unit: 'un', minimumStock: 0, active: true },
  });

  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const deactivateProduct = useDeactivateProductMutation();

  const submit = handleSubmit((input) => {
    const onSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast(product ? 'Produto atualizado' : 'Produto cadastrado');
      onSaved();
    };
    const onError = (error: unknown) => toast(apiErrorMessage(error), 'danger');

    if (product) {
      updateProduct.mutate({ id: product.id, input }, { onSuccess, onError });
    } else {
      createProduct.mutate(input, { onSuccess, onError });
    }
  });

  const deactivate = () => {
    if (!product) return;
    deactivateProduct.mutate(product.id, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['products'] });
        toast('Produto desativado');
        onSaved();
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  };

  return {
    register,
    errors,
    submit,
    saving: createProduct.isPending || updateProduct.isPending,
    canEnterStock,
    deactivate,
  };
}
