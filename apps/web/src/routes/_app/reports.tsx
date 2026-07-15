import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PAYMENT_METHOD_LABELS } from '@beverage/shared';
import { Screen } from '../_app';
import {
  SBars,
  SBtn,
  SCard,
  SChip,
  SModal,
  SSeg,
  SStat,
  STable,
  STag,
  useToast,
} from '../../components/sol';
import { api, apiErrorMessage } from '../../lib/api';
import { buildCupom, STORE } from '../../lib/cupom';
import { formatBRL, formatDateTime, toDateInput } from '../../lib/format';
import { getToken } from '../../lib/auth';
import type { Paginated, Sale } from '../../lib/types';

export const Route = createFileRoute('/_app/reports')({
  component: ReportsPage,
});

type Tab = 'sales' | 'best' | 'margin' | 'stock';

interface SalesReport {
  days: { day: string; count: number; total: number }[];
  count: number;
  /** Receita líquida de taxa de serviço (só produtos) — ver ADR 0002. */
  total: number;
  serviceFeeTotal: number;
}

interface ProductPerf {
  product: { id: string; name: string; sku: string; unit: string } | null;
  quantity: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
}

interface StockPositionRow {
  id: string;
  sku: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  stockCost: number;
  stockValue: number;
}

function ReportsPage() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('sales');
  const [from, setFrom] = useState(toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(toDateInput(now));
  const [chip, setChip] = useState<'today' | 'week' | 'month'>('month');

  function applyChip(c: 'today' | 'week' | 'month') {
    setChip(c);
    const today = new Date();
    if (c === 'today') {
      setFrom(toDateInput(today));
      setTo(toDateInput(today));
    } else if (c === 'week') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      setFrom(toDateInput(start));
      setTo(toDateInput(today));
    } else {
      setFrom(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
      setTo(toDateInput(today));
    }
  }

  // FR-41: exportação CSV via endpoint autenticado
  async function exportCsv() {
    const endpoint =
      tab === 'stock' ? '/reports/stock-position' : tab === 'sales' ? '/reports/sales' : '/reports/products';
    const response = await fetch(
      `/api${endpoint}?format=csv&from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${getToken()}` } },
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${tab}-${from}-a-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Screen title="Relatórios">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <SSeg<Tab>
          items={[
            { id: 'sales', label: 'Vendas por período' },
            { id: 'best', label: 'Mais vendidos' },
            { id: 'margin', label: 'Margem por produto' },
            { id: 'stock', label: 'Posição de estoque' },
          ]}
          active={tab}
          onChange={setTab}
        />
        {tab !== 'stock' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <div className="s-label">De</div>
              <div className="s-input" style={{ width: 130 }}>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="s-label">Até</div>
              <div className="s-input" style={{ width: 130 }}>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <SChip active={chip === 'today'} onClick={() => applyChip('today')}>Hoje</SChip>
            <SChip active={chip === 'week'} onClick={() => applyChip('week')}>7 dias</SChip>
            <SChip active={chip === 'month'} onClick={() => applyChip('month')}>Mês atual</SChip>
            <span style={{ flex: 1 }} />
            <SBtn ghost onClick={() => void exportCsv()}>Exportar CSV</SBtn>
            <SBtn ghost onClick={() => window.print()}>Exportar PDF</SBtn>
          </div>
        )}
        {tab === 'stock' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => void exportCsv()}>Exportar CSV</SBtn>
          </div>
        )}

        {tab === 'sales' && <SalesTab from={from} to={to} />}
        {(tab === 'best' || tab === 'margin') && <ProductsTab from={from} to={to} margin={tab === 'margin'} />}
        {tab === 'stock' && <StockTab />}
      </div>
    </Screen>
  );
}

// ---------- Vendas por período (FR-37) + histórico com estorno (FR-22/24) ----------

function SalesTab({ from, to }: { from: string; to: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [detail, setDetail] = useState<Sale | null>(null);

  const { data: report } = useQuery({
    queryKey: ['reports', 'sales', from, to],
    queryFn: async () =>
      (await api.get<SalesReport>('/reports/sales', { params: { from, to } })).data,
  });
  const { data: history } = useQuery({
    queryKey: ['sales', 'history', from, to],
    queryFn: async () =>
      (await api.get<Paginated<Sale>>('/sales/history', {
        params: { from, to: `${to}T23:59:59` },
      })).data,
  });

  const voidSale = useMutation({
    mutationFn: async (id: string) => (await api.post(`/sales/${id}/void`)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Venda estornada — estoque e receita revertidos (BR-05)');
      setVoiding(null);
    },
    onError: (error) => toast(apiErrorMessage(error), 'danger'),
  });

  const sales = history?.items ?? [];
  const cancelled = sales.filter((s) => s.status === 'CANCELLED').length;
  const ticket = report && report.count > 0 ? Number(report.total) / report.count : 0;

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <SStat label="Receita no período" value={formatBRL(report?.total)} sub="produtos, líquida de taxa de serviço" />
        <SStat label="Taxa de serviço" value={formatBRL(report?.serviceFeeTotal)} sub="10% — fica com a casa" />
        <SStat label="Nº de vendas" value={report?.count ?? 0} />
        <SStat label="Ticket médio" value={formatBRL(ticket)} />
        <SStat label="Canceladas" value={cancelled} sub="estoque estornado automaticamente" />
      </div>
      <SCard>
        <div className="s-card-title">
          Receita por dia <span className="s-dim" style={{ fontWeight: 400 }}>(R$)</span>
        </div>
        <SBars
          values={(report?.days ?? []).map((d) => Number(d.total))}
          labels={(report?.days ?? []).map((d) => d.day.slice(8))}
          height={110}
          hl={(report?.days.length ?? 0) - 1}
        />
        {(report?.days ?? []).length === 0 && (
          <div className="s-dim" style={{ fontSize: 12.5 }}>Sem vendas no período.</div>
        )}
      </SCard>
      <SCard pad={8} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <STable
          cols={['Data/hora', 'Venda', 'Itens', 'Pagamento', 'NF', 'Total', '']}
          widths="130px 90px 60px 1fr 60px 110px 100px"
          align={[null, null, 'center', null, 'center', 'right', 'right']}
          dense
          emptyText="Nenhuma venda no período"
          rows={sales.map((s) => ({
            key: s.id,
            onClick: () => setDetail(s),
            cells: [
              formatDateTime(s.completedAt ?? s.cancelledAt),
              `#${s.id.slice(-6).toUpperCase()}`,
              s.items.reduce((acc, i) => acc + i.quantity, 0),
              s.paymentMethod ? PAYMENT_METHOD_LABELS[s.paymentMethod] : '—',
              s.withInvoice ? 'sim' : 'não',
              <b key="t">{formatBRL(s.total)}</b>,
              s.status === 'CANCELLED' ? (
                <STag key="a" tone="danger">cancelada</STag>
              ) : (
                // span impede que o clique no Estornar também abra o detalhe
                <span key="a" onClick={(e) => e.stopPropagation()}>
                  <SBtn ghost danger onClick={() => setVoiding(s)}>Estornar</SBtn>
                </span>
              ),
            ],
          }))}
        />
      </SCard>
      {detail && <SaleDetailModal sale={detail} onClose={() => setDetail(null)} />}
      {voiding && (
        <SModal title={`Estornar venda #${voiding.id.slice(-6).toUpperCase()}?`} onClose={() => setVoiding(null)}>
          <div className="s-dim" style={{ fontSize: 13.5, marginBottom: 16 }}>
            Os itens voltam ao estoque e o valor é deduzido da receita (BR-05). O histórico é
            preservado para auditoria.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <SBtn ghost onClick={() => setVoiding(null)}>Voltar</SBtn>
            <SBtn danger disabled={voidSale.isPending} onClick={() => voidSale.mutate(voiding.id)}>
              Estornar venda
            </SBtn>
          </div>
        </SModal>
      )}
    </>
  );
}

// Detalhe de uma venda do histórico: itens, totais e reimpressão do cupom
// (só para vendas concluídas — estornada é consulta, não gera cupom).
function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const cancelled = sale.status === 'CANCELLED';
  const serviceFee = sale.serviceFee ?? 0;
  const discount = sale.subtotal - (sale.total - serviceFee);
  return (
    <SModal title={`Venda #${sale.id.slice(-6).toUpperCase()}`} onClose={onClose} width={480}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        {cancelled ? <STag tone="danger">estornada</STag> : <STag tone="accent">concluída</STag>}
        <span className="s-dim" style={{ fontSize: 12.5 }}>
          {formatDateTime(sale.completedAt ?? sale.cancelledAt)} · Operador: {sale.operator.name}
        </span>
      </div>
      <STable
        cols={['Produto', 'Qtd', 'Unit.', 'Total']}
        widths="1fr 50px 90px 90px"
        align={[null, 'center', 'right', 'right']}
        dense
        rows={sale.items.map((i) => ({
          key: i.id,
          cells: [
            i.product.name,
            i.quantity,
            formatBRL(i.unitPrice),
            formatBRL(i.unitPrice * i.quantity),
          ],
        }))}
      />
      <div className="s-divider" />
      <div className="s-kv"><span>Subtotal</span><b>{formatBRL(sale.subtotal)}</b></div>
      {discount > 0.005 && (
        <div className="s-kv">
          <span>
            Desconto{sale.discountType === 'PERCENT' ? ` (${sale.discountValue}%)` : ''}
          </span>
          <b>-{formatBRL(discount)}</b>
        </div>
      )}
      {serviceFee > 0 && (
        <div className="s-kv"><span>Taxa de serviço (10%)</span><b>{formatBRL(serviceFee)}</b></div>
      )}
      <div className="s-kv"><span>Total</span><b style={{ fontSize: 16 }}>{formatBRL(sale.total)}</b></div>
      <div className="s-kv">
        <span>Pagamento</span>
        <b>{sale.paymentMethod ? PAYMENT_METHOD_LABELS[sale.paymentMethod] : '—'}</b>
      </div>
      {sale.change !== null && (
        <>
          <div className="s-kv"><span>Recebido</span><b>{formatBRL(sale.amountPaid)}</b></div>
          <div className="s-kv"><span>Troco</span><b>{formatBRL(sale.change)}</b></div>
        </>
      )}
      {sale.customer && (
        <div className="s-kv"><span>Cliente</span><b>{sale.customer.name}</b></div>
      )}
      {/* Cupom oculto na tela — vira o conteúdo da página só na impressão */}
      {!cancelled && <pre className="s-receipt s-cupom s-print-only">{buildCupom(sale, STORE)}</pre>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        {!cancelled && <SBtn ghost onClick={() => window.print()}>Imprimir cupom</SBtn>}
        <SBtn primary onClick={onClose}>Fechar</SBtn>
      </div>
    </SModal>
  );
}

// ---------- Mais vendidos / margem (FR-38/39) ----------

function ProductsTab({ from, to, margin }: { from: string; to: string; margin: boolean }) {
  const { data: rows = [] } = useQuery({
    queryKey: ['reports', 'products', from, to],
    queryFn: async () =>
      (await api.get<ProductPerf[]>('/reports/products', { params: { from, to } })).data,
  });
  const sorted = margin ? [...rows].sort((a, b) => Number(b.margin) - Number(a.margin)) : rows;

  return (
    <SCard pad={8} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <STable
        cols={['Produto', 'SKU', 'Qtd vendida', 'Receita', 'Custo', 'Margem', 'Margem %']}
        widths="1fr 100px 100px 110px 110px 110px 90px"
        align={[null, null, 'center', 'right', 'right', 'right', 'right']}
        dense
        emptyText="Sem vendas no período"
        rows={sorted.map((r, i) => ({
          key: r.product?.id ?? String(i),
          cells: [
            r.product?.name ?? '—',
            r.product?.sku ?? '—',
            <b key="q">{r.quantity}</b>,
            formatBRL(r.revenue),
            formatBRL(r.cost),
            <b key="m">{formatBRL(r.margin)}</b>,
            `${Number(r.marginPercent).toFixed(1)}%`,
          ],
        }))}
      />
    </SCard>
  );
}

// ---------- Posição de estoque (FR-40) ----------

function StockTab() {
  const { data: rows = [] } = useQuery({
    queryKey: ['reports', 'stock-position'],
    queryFn: async () => (await api.get<StockPositionRow[]>('/reports/stock-position')).data,
  });
  const totalCost = rows.reduce((acc, r) => acc + Number(r.stockCost), 0);
  const totalValue = rows.reduce((acc, r) => acc + Number(r.stockValue), 0);

  return (
    <>
      <div style={{ display: 'flex', gap: 12 }}>
        <SStat label="Itens ativos" value={rows.length} />
        <SStat label="Custo em estoque" value={formatBRL(totalCost)} />
        <SStat label="Valor de venda do estoque" value={formatBRL(totalValue)} accent />
      </div>
      <SCard pad={8} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <STable
          cols={['SKU', 'Produto', 'Un.', 'Estoque', 'Mín.', 'Custo total', 'Valor de venda']}
          widths="90px 1fr 50px 80px 60px 120px 120px"
          align={[null, null, null, 'center', 'center', 'right', 'right']}
          dense
          rows={rows.map((r) => ({
            key: r.id,
            cells: [
              r.sku,
              r.name,
              r.unit,
              r.minimumStock > 0 && r.currentStock <= r.minimumStock ? (
                <b key="s" className="s-low">{r.currentStock}</b>
              ) : (
                r.currentStock
              ),
              r.minimumStock,
              formatBRL(r.stockCost),
              formatBRL(r.stockValue),
            ],
          }))}
        />
      </SCard>
    </>
  );
}
