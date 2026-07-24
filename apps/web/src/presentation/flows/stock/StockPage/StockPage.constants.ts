import type { MovementSource } from '@/domain/models/stock';

export const SOURCE_LABELS: Record<MovementSource, string> = {
  PURCHASE: 'Compra/reposição',
  SALE: 'Venda (PDV)',
  ADJUSTMENT: 'Ajuste manual',
  CANCELLATION: 'Estorno de venda',
};
