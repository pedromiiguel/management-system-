import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { productSchema, stockEntrySchema, type ProductInput } from '@beverage/shared';
import { Screen } from '../_app';
import { Confirm } from '../../components/confirm';
import {
  SBtn,
  SCard,
  SChip,
  SIconBtn,
  SModal,
  SolIcon,
  STable,
  STag,
  useToast,
} from '../../components/sol';
import { api, apiErrorMessage } from '../../lib/api';
import { formatBRL } from '../../lib/format';
import type { Paginated, Product, StockAlerts } from '../../lib/types';

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
});

type Filter = 'all' | 'active' | 'low' | 'expiring';
type Modal =
  | { kind: 'none' }
  | { kind: 'product'; product?: Product }
  | { kind: 'entry'; product?: Product };

function ProductsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>({ kind: 'none' });

  const { data, refetch } = useQuery({
    queryKey: ['products', 'list', search, page],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', {
        params: { search: search || undefined, page, all: 'true', perPage: 50 },
      })).data,
  });
  const { data: alerts } = useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: async () => (await api.get<StockAlerts>('/stock/alerts')).data,
  });

  const lowIds = useMemo(() => new Set(alerts?.lowStock.map((p) => p.id) ?? []), [alerts]);
  const expiringIds = useMemo(
    () => new Set(alerts?.expiring.map((b) => b.product.id) ?? []),
    [alerts],
  );
  const expiringByProduct = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of alerts?.expiring ?? []) {
      if (b.expiresAt && !map.has(b.product.id)) {
        const days = Math.ceil((new Date(b.expiresAt).getTime() - Date.now()) / 86_400_000);
        map.set(b.product.id, days <= 0 ? 'vencido' : `vence em ${days}d`);
      }
    }
    return map;
  }, [alerts]);

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Produto excluído');
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const handleDelete = async (product: Product) => {
    const confirmed = await Confirm.call({
      title: 'Excluir produto?',
      message: (
        <>
          Tem certeza que deseja excluir <b>{product.name}</b>? Essa ação não pode ser desfeita.
        </>
      ),
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (confirmed) remove.mutate(product.id);
  };

  const allItems = data?.items ?? [];
  const items = allItems.filter((p) => {
    if (filter === 'active') return p.active;
    if (filter === 'low') return lowIds.has(p.id);
    if (filter === 'expiring') return expiringIds.has(p.id);
    return true;
  });

  return (
    <Screen
      title="Produtos & Estoque"
      topRight={
        <>
          <SBtn ghost onClick={() => setModal({ kind: 'entry' })}>Entrada de estoque</SBtn>
          <SBtn primary onClick={() => setModal({ kind: 'product' })}>+ Novo produto</SBtn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="s-input" style={{ width: 400 }}>
            <SolIcon name="search" size={15} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, SKU ou código de barras…"
            />
          </div>
          <SChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos · {data?.total ?? 0}
          </SChip>
          <SChip active={filter === 'active'} onClick={() => setFilter('active')}>Ativos</SChip>
          <SChip active={filter === 'low'} onClick={() => setFilter('low')}>
            Estoque baixo · {alerts?.lowStock.length ?? 0}
          </SChip>
          <SChip active={filter === 'expiring'} onClick={() => setFilter('expiring')}>
            Vencimento próximo · {expiringIds.size}
          </SChip>
        </div>

        <SCard pad={8} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <STable
            cols={['SKU', 'Código de barras', 'Produto', 'Preço venda', 'Estoque', 'Mín.', 'Situação', 'Ações']}
            widths="80px 140px 1fr 110px 80px 60px 150px 60px"
            align={[null, null, null, 'right', 'center', 'center', null, 'center']}
            dense
            rows={items.map((p) => {
              const low = lowIds.has(p.id);
              const expiry = expiringByProduct.get(p.id);
              return {
                key: p.id,
                onClick: () => setModal({ kind: 'product', product: p }),
                cells: [
                  p.sku,
                  p.ean ?? '—',
                  p.name,
                  formatBRL(p.salePrice),
                  low ? <b key="s" className="s-low">{p.currentStock}</b> : p.currentStock,
                  p.minimumStock,
                  !p.active ? (
                    <STag key="t" tone="dim">inativo</STag>
                  ) : expiry ? (
                    <STag key="t" tone="warn">{expiry}</STag>
                  ) : low ? (
                    <STag key="t" tone="warn">estoque baixo</STag>
                  ) : (
                    <STag key="t" tone="ok">ativo</STag>
                  ),
                  <SIconBtn
                    key="del"
                    icon="trash"
                    danger
                    title="Excluir produto"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(p);
                    }}
                  />,
                ],
              };
            })}
          />
        </SCard>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="s-dim" style={{ fontSize: 12.5 }}>
            Produtos com venda registrada não são excluídos — apenas desativados.
          </span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <SBtn ghost disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</SBtn>
            <span className="s-dim" style={{ fontSize: 13 }}>página {page}</span>
            <SBtn
              ghost
              disabled={(data?.total ?? 0) <= page * 50}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </SBtn>
          </span>
        </div>
      </div>

      {modal.kind === 'product' && (
        <ProductModal
          product={modal.product}
          onSaved={() => {
            setModal({ kind: 'none' });
            void refetch();
          }}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'entry' && (
        <StockEntryModal
          product={modal.product}
          onSaved={() => {
            setModal({ kind: 'none' });
            void refetch();
          }}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
    </Screen>
  );
}

// ---------- Cadastro / edição (FR-01/FR-02) ----------

function ProductModal({
  product,
  onSaved,
  onClose,
}: {
  product?: Product;
  onSaved: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof productSchema>, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
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

  const save = useMutation({
    mutationFn: async (input: ProductInput) =>
      product
        ? (await api.patch(`/products/${product.id}`, input)).data
        : (await api.post('/products', input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast(product ? 'Produto atualizado' : 'Produto cadastrado');
      onSaved();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const deactivate = useMutation({
    mutationFn: async () => (await api.patch(`/products/${product!.id}/deactivate`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Produto desativado');
      onSaved();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const field = (label: string, error: string | undefined, input: React.ReactNode) => (
    <div style={{ flex: 1 }}>
      <div className="s-label">{label}</div>
      <div className="s-input">{input}</div>
      {error && <div className="s-error">{error}</div>}
    </div>
  );

  return (
    <SModal title={product ? `Editar — ${product.name}` : 'Novo produto'} onClose={onClose} width={520}>
      <form
        onSubmit={handleSubmit((data) => save.mutate(data))}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {field('Nome', errors.name?.message, <input autoFocus {...register('name')} />)}
        <div style={{ display: 'flex', gap: 10 }}>
          {field('SKU', errors.sku?.message, <input {...register('sku')} />)}
          {field('Código de barras (EAN)', errors.ean?.message, <input {...register('ean')} />)}
          {field('Unidade', errors.unit?.message, <input {...register('unit')} />)}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {field(
            'Preço de compra (R$)',
            errors.purchasePrice?.message,
            <input type="number" step="0.01" min="0" {...register('purchasePrice', { valueAsNumber: true })} />,
          )}
          {field(
            'Preço de venda (R$)',
            errors.salePrice?.message,
            <input type="number" step="0.01" min="0" {...register('salePrice', { valueAsNumber: true })} />,
          )}
          {field(
            'Estoque mínimo',
            errors.minimumStock?.message,
            <input type="number" min="0" {...register('minimumStock', { valueAsNumber: true })} />,
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          {product ? (
            <SBtn ghost danger onClick={() => deactivate.mutate()}>
              {product.active ? 'Desativar' : 'Produto inativo'}
            </SBtn>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <SBtn ghost onClick={onClose}>Voltar</SBtn>
            <SBtn primary type="submit" disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : 'Salvar'}
            </SBtn>
          </div>
        </div>
      </form>
    </SModal>
  );
}

// ---------- Entrada de estoque (FR-05/FR-08) ----------

export function StockEntryModal({
  product,
  onSaved,
  onClose,
}: {
  product?: Product;
  onSaved: () => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<Product | null>(product ?? null);
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['products', 'search', search],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { search, perPage: 6 } })).data,
    enabled: !picked && search.length >= 2,
  });

  const entryFormSchema = stockEntrySchema.omit({ productId: true });
  type EntryFormOutput = z.output<typeof entryFormSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof entryFormSchema>, unknown, EntryFormOutput>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: { quantity: 1 },
  });

  const save = useMutation({
    mutationFn: async (input: EntryFormOutput) =>
      (await api.post('/stock/entries', { ...input, productId: picked!.id })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast('Entrada registrada');
      onSaved();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  return (
    <SModal title="Entrada de estoque" onClose={onClose} width={480}>
      {!picked ? (
        <>
          <div className="s-input" style={{ marginBottom: 10 }}>
            <SolIcon name="search" size={15} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto…"
            />
          </div>
          <STable
            cols={['Produto', 'Estoque']}
            widths="1fr 80px"
            align={[null, 'center']}
            dense
            emptyText={search.length >= 2 ? 'Nada encontrado' : 'Digite para buscar o produto'}
            rows={(data?.items ?? []).map((p) => ({
              key: p.id,
              onClick: () => setPicked(p),
              cells: [p.name, p.currentStock],
            }))}
          />
        </>
      ) : (
        <form
          onSubmit={handleSubmit((input) => save.mutate(input))}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div className="s-kv">
            <span>Produto</span>
            <b>{picked.name} (estoque: {picked.currentStock})</b>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="s-label">Quantidade</div>
              <div className="s-input">
                <input autoFocus type="number" min="1" {...register('quantity', { valueAsNumber: true })} />
              </div>
              {errors.quantity && <div className="s-error">{errors.quantity.message}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="s-label">Custo unitário (R$) — opcional</div>
              <div className="s-input">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('unitCost', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="s-label">Lote — opcional</div>
              <div className="s-input">
                <input {...register('batch', { setValueAs: (v: string) => v || undefined })} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="s-label">Validade — opcional</div>
              <div className="s-input">
                <input
                  type="date"
                  {...register('expiresAt', {
                    setValueAs: (v: string) => (v ? new Date(v) : undefined),
                  })}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => setPicked(null)}>Trocar produto</SBtn>
            <SBtn primary type="submit" disabled={save.isPending}>
              {save.isPending ? 'Salvando…' : 'Registrar entrada'}
            </SBtn>
          </div>
        </form>
      )}
    </SModal>
  );
}
