import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Confirm } from '@/components/confirm';
import { useToast } from '@/components/sol';
import { apiErrorMessage } from '@/lib/api';
import type { Product } from '@/domain/models/products';
import { useDeleteProductMutation } from '@/main/factories/mutations/products';
import { useProductCatalogQuery } from '@/main/factories/queries/products';
import { useStockAlertsQuery } from '@/main/factories/queries/stock';
import type { ProductFilter, ProductModalState } from './ProductsPage.types';

export function useProductsPageModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProductFilter>('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ProductModalState>({ kind: 'none' });

  const { data, refetch } = useProductCatalogQuery(search, page);
  const { data: alerts } = useStockAlertsQuery();

  const remove = useDeleteProductMutation();

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await Confirm.call({
      title: 'Excluir produto?',
      message: `Tem certeza que deseja excluir ${product.name}? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!confirmed) return;
    remove.mutate(product.id, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['products'] });
        toast('Produto excluído');
      },
      onError: (error) => toast(apiErrorMessage(error), 'danger'),
    });
  };

  const onSaved = () => {
    setModal({ kind: 'none' });
    void refetch();
  };

  return {
    search,
    changeSearch,
    filter,
    setFilter,
    page,
    setPage,
    data,
    alerts,
    modal,
    setModal,
    handleDelete,
    onSaved,
  };
}
