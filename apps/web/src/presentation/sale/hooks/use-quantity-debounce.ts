import { useCallback, useRef, useState } from 'react';
import type { SaleItem } from '@/domain/models/sale';

type UpdateQuantity = (itemId: string, quantity: number) => Promise<{ warning: string | null }>;

/**
 * Estado otimista da quantidade por item: mostra o clique/digitação na hora e
 * só sincroniza com o servidor depois de 400ms de debounce (evita 1 request
 * por clique quando o operador está zerando uma quantidade grande). Coberto
 * por apps/e2e/tests/05-quantidade.spec.ts — ver ADR 0001/0003.
 */
export function useQuantityDebounce(
  updateQuantity: UpdateQuantity,
  onSuccess: (warning: string | null) => void,
  onError: (error: unknown) => void,
) {
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const qtyPending = useRef<Record<string, { quantity: number; timer: ReturnType<typeof setTimeout> }>>({});

  const commitQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      delete qtyPending.current[itemId];
      try {
        // Não deixa uma falha rejeitar o Promise.all de flushPendingQuantity —
        // o erro já é reportado via onError.
        const { warning } = await updateQuantity(itemId, quantity);
        onSuccess(warning);
      } catch (error) {
        onError(error);
      } finally {
        setPendingQty((prev) => {
          if (!(itemId in prev)) return prev;
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }
    },
    [updateQuantity, onSuccess, onError],
  );

  const scheduleQuantity = useCallback(
    (item: SaleItem, quantity: number) => {
      if (quantity < 1) return;
      const existing = qtyPending.current[item.id];
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => commitQuantity(item.id, quantity), 400);
      qtyPending.current[item.id] = { quantity, timer };
      setPendingQty((prev) => ({ ...prev, [item.id]: quantity }));
    },
    [commitQuantity],
  );

  // +/- lê o último valor gravado no ref (síncrono) em vez da prop do último
  // render — cliques disparados antes do React re-renderizar não pisam um no outro.
  const stepQuantity = useCallback(
    (item: SaleItem, delta: number) => {
      const current = qtyPending.current[item.id]?.quantity ?? item.quantity;
      scheduleQuantity(item, current + delta);
    },
    [scheduleQuantity],
  );

  // Dispara na hora qualquer alteração ainda no debounce — chamado antes de
  // finalizar, remover item, cancelar ou aplicar desconto.
  const flushPendingQuantity = useCallback(() => {
    const pending = Object.entries(qtyPending.current);
    return Promise.all(
      pending.map(([itemId, { quantity, timer }]) => {
        clearTimeout(timer);
        return commitQuantity(itemId, quantity);
      }),
    );
  }, [commitQuantity]);

  return { pendingQty, scheduleQuantity, stepQuantity, flushPendingQuantity };
}
