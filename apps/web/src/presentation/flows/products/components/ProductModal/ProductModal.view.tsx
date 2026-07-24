import type { ReactNode } from 'react';
import { SBtn, SModal } from '@/components/sol';
import type { ProductModalViewProps } from './ProductModal.types';

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <div className="s-label">{label}</div>
      <div className="s-input">{children}</div>
      {error && <div className="s-error">{error}</div>}
    </div>
  );
}

export function ProductModalView({
  product,
  register,
  errors,
  onSubmit,
  saving,
  canEnterStock,
  onDeactivate,
  onClose,
}: ProductModalViewProps) {
  return (
    <SModal title={product ? `Editar — ${product.name}` : 'Novo produto'} onClose={onClose} width={520}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Nome" error={errors.name?.message}>
          <input autoFocus data-testid="product-name" {...register('name')} />
        </Field>
        <div className="flex gap-2.5">
          <Field label="SKU" error={errors.sku?.message}>
            <input data-testid="product-sku" {...register('sku')} />
          </Field>
          <Field label="Código de barras (EAN)" error={errors.ean?.message}>
            <input {...register('ean')} />
          </Field>
          <Field label="Unidade" error={errors.unit?.message}>
            <input {...register('unit')} />
          </Field>
        </div>
        <div className="flex gap-2.5">
          <Field label="Preço de compra (R$)" error={errors.purchasePrice?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              data-testid="product-purchase-price"
              {...register('purchasePrice', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Preço de venda (R$)" error={errors.salePrice?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              data-testid="product-sale-price"
              {...register('salePrice', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Estoque mínimo" error={errors.minimumStock?.message}>
            <input type="number" min="0" {...register('minimumStock', { valueAsNumber: true })} />
          </Field>
        </div>
        {canEnterStock && (
          <div className="border-t border-[var(--line)] pt-3">
            <div className="s-label mb-1.5">
              Adicionar ao estoque — opcional
              {product && <span className="s-dim"> (atual: {product.currentStock})</span>}
            </div>
            <div className="flex gap-2.5">
              <Field label="Quantidade" error={errors.stockEntry?.quantity?.message}>
                <input
                  type="number"
                  min="1"
                  data-testid="product-stock-entry-quantity"
                  {...register('stockEntry.quantity', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </Field>
              <Field label="Lote — opcional">
                <input
                  {...register('stockEntry.batch', { setValueAs: (v: string) => v || undefined })}
                />
              </Field>
              <Field label="Validade — opcional">
                <input
                  type="date"
                  {...register('stockEntry.expiresAt', {
                    setValueAs: (v: string) => (v ? new Date(v) : undefined),
                  })}
                />
              </Field>
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-between mt-1">
          {product ? (
            <SBtn ghost danger onClick={onDeactivate}>
              {product.active ? 'Desativar' : 'Produto inativo'}
            </SBtn>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <SBtn ghost onClick={onClose}>Voltar</SBtn>
            <SBtn primary type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </SBtn>
          </div>
        </div>
      </form>
    </SModal>
  );
}
