import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Screen } from '../_app';
import { StockEntryModal } from '../../presentation/flows/products/components/StockEntryModal';
import { SBtn, SCard, SModal, SolIcon, STable, STag, useToast } from '../../components/sol';
import { api, apiErrorMessage } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import type { Paginated, Product, StockAlerts } from '../../lib/types';

export const Route = createFileRoute('/_app/stock')({
  component: StockPage,
});

interface Movement {
  id: string;
  type: 'ENTRY' | 'EXIT';
  source: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'CANCELLATION';
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string; unit: string };
}

const SOURCE_LABELS: Record<Movement['source'], string> = {
  PURCHASE: 'Compra/reposição',
  SALE: 'Venda (PDV)',
  ADJUSTMENT: 'Ajuste manual',
  CANCELLATION: 'Estorno de venda',
};

function StockPage() {
  const [modal, setModal] = useState<'none' | 'entry' | 'adjust'>('none');

  const { data: alerts } = useQuery({
    queryKey: ['stock', 'alerts'],
    queryFn: async () => (await api.get<StockAlerts>('/stock/alerts')).data,
  });
  const { data: movements = [], refetch } = useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: async () => (await api.get<Movement[]>('/stock/movements')).data,
  });

  return (
    <Screen
      title="Estoque"
      topRight={
        <>
          <SBtn ghost onClick={() => setModal('adjust')}>Ajuste manual</SBtn>
          <SBtn primary onClick={() => setModal('entry')}>Entrada de estoque</SBtn>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 12, height: '100%' }}>
        <SCard pad={8} style={{ minHeight: 0, overflow: 'auto' }}>
          <div className="s-card-title" style={{ padding: '8px 10px 4px' }}>Movimentações recentes</div>
          <STable
            cols={['Data', 'Produto', 'Tipo', 'Origem', 'Qtd']}
            widths="110px 1fr 80px 150px 60px"
            align={[null, null, null, null, 'center']}
            dense
            rows={movements.map((m) => ({
              key: m.id,
              cells: [
                formatDateTime(m.createdAt),
                <span key="p">{m.product.name}{m.note ? <span className="s-dim"> — {m.note}</span> : null}</span>,
                m.type === 'ENTRY' ? <STag key="t" tone="ok">entrada</STag> : <STag key="t" tone="dim">saída</STag>,
                SOURCE_LABELS[m.source],
                <b key="q">{m.type === 'ENTRY' ? '+' : '−'}{m.quantity}</b>,
              ],
            }))}
          />
        </SCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'auto' }}>
          <SCard>
            <div className="s-card-title">Estoque abaixo do mínimo (FR-07)</div>
            <STable
              cols={['Produto', 'Atual', 'Mín.']}
              widths="1fr 60px 50px"
              align={[null, 'center', 'center']}
              dense
              emptyText="Tudo acima do mínimo ✓"
              rows={(alerts?.lowStock ?? []).map((p) => ({
                key: p.id,
                cells: [p.name, <b key="c" className="s-low">{p.currentStock}</b>, p.minimumStock],
              }))}
            />
          </SCard>
          <SCard>
            <div className="s-card-title">Vencimento próximo — FEFO (FR-08)</div>
            <STable
              cols={['Produto', 'Lote', 'Validade', 'Qtd']}
              widths="1fr 60px 90px 50px"
              align={[null, null, null, 'center']}
              dense
              emptyText="Nenhum lote vencendo ✓"
              rows={(alerts?.expiring ?? []).map((b) => ({
                key: b.id,
                cells: [
                  b.product.name,
                  b.batch ?? '—',
                  <STag key="v" tone="warn">{formatDate(b.expiresAt)}</STag>,
                  b.quantity,
                ],
              }))}
            />
          </SCard>
        </div>
      </div>

      {modal === 'entry' && (
        <StockEntryModal
          onSaved={() => {
            setModal('none');
            void refetch();
          }}
          onClose={() => setModal('none')}
        />
      )}
      {modal === 'adjust' && (
        <AdjustModal
          onSaved={() => {
            setModal('none');
            void refetch();
          }}
          onClose={() => setModal('none')}
        />
      )}
    </Screen>
  );
}

function AdjustModal({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data } = useQuery({
    queryKey: ['products', 'search', search],
    queryFn: async () =>
      (await api.get<Paginated<Product>>('/products', { params: { search, perPage: 6 } })).data,
    enabled: !picked && search.length >= 2,
  });

  const save = useMutation({
    mutationFn: async () =>
      (await api.post('/stock/adjustments', {
        productId: picked!.id,
        quantity: Number(quantity),
        reason,
      })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast('Ajuste registrado');
      onSaved();
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const qty = Number(quantity);
  const valid = picked && Number.isInteger(qty) && qty !== 0 && reason.trim().length >= 3;

  return (
    <SModal title="Ajuste manual de estoque" onClose={onClose} width={460}>
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
            emptyText={search.length >= 2 ? 'Nada encontrado' : 'Digite para buscar'}
            rows={(data?.items ?? []).map((p) => ({
              key: p.id,
              onClick: () => setPicked(p),
              cells: [p.name, p.currentStock],
            }))}
          />
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="s-kv">
            <span>Produto</span>
            <b>{picked.name} (estoque: {picked.currentStock})</b>
          </div>
          <div>
            <div className="s-label">Quantidade (positivo aumenta, negativo reduz)</div>
            <div className="s-input">
              <input
                autoFocus
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="ex.: -3 (quebra), 10 (inventário)"
              />
            </div>
          </div>
          <div>
            <div className="s-label">Motivo (auditável)</div>
            <div className="s-input">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ex.: quebra, perda, contagem de inventário"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => setPicked(null)}>Trocar produto</SBtn>
            <SBtn primary disabled={!valid || save.isPending} onClick={() => save.mutate()}>
              Registrar ajuste
            </SBtn>
          </div>
        </div>
      )}
    </SModal>
  );
}
