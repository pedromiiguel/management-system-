import { PAYMENT_METHOD_LABELS } from '@beverage/shared';
import type { Sale } from './types';

/**
 * Cupom não-fiscal para impressora térmica de 80mm (FR-23).
 * Gera texto puro em colunas fixas — o preview na tela é exatamente o que
 * a impressora recebe. Sem SEFAZ: é um comprovante, não documento fiscal.
 */

const WIDTH = 40;

// Larguras das colunas de itens (somadas aos 5 espaços separadores = 40).
const COL = { num: 2, code: 5, desc: 10, qty: 3, unit: 7, total: 8 } as const;

const money = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function brl(value: number): string {
  return `R$ ${money.format(value)}`;
}

function center(text: string, width = WIDTH): string {
  if (text.length >= width) return text;
  return ' '.repeat(Math.floor((width - text.length) / 2)) + text;
}

/** Corta com reticências quando não cabe na coluna. */
function fit(text: string, width: number): string {
  if (text.length <= width) return text.padEnd(width);
  return `${text.slice(0, width - 1)}…`;
}

/** Linha "LABEL ........ valor" com o valor alinhado à direita. */
function kv(label: string, value: string): string {
  return label + value.padStart(Math.max(WIDTH - label.length, value.length + 1));
}

function headerRow(cells: [string, string, string, string, string, string]): string {
  const [num, code, desc, qty, unit, total] = cells;
  return [
    num.padEnd(COL.num),
    fit(code, COL.code),
    fit(desc, COL.desc),
    qty.padStart(COL.qty),
    unit.padStart(COL.unit),
    total.padStart(COL.total),
  ].join(' ');
}

// Espaço antes da descrição na 1ª linha do item (# + CÓD. + separadores).
const DESC_PREFIX = COL.num + 1 + COL.code + 1;

/**
 * Item em duas linhas: a descrição ocupa a 1ª linha inteira (até 31 chars)
 * e os números ficam na 2ª, alinhados às colunas UN/VL.UNIT/VL.TOTAL do
 * cabeçalho — descrição legível sem perder o formato de colunas.
 */
function itemRows(cells: [string, string, string, string, string, string]): string[] {
  const [num, code, desc, qty, unit, total] = cells;
  return [
    [num.padEnd(COL.num), fit(code, COL.code), fit(desc, WIDTH - DESC_PREFIX)].join(' ').trimEnd(),
    [
      ' '.repeat(DESC_PREFIX + COL.desc),
      qty.padStart(COL.qty),
      unit.padStart(COL.unit),
      total.padStart(COL.total),
    ].join(' '),
  ];
}

/** "12345678000190" → "12.345.678/0001-90" (se já vier pontuado, mantém). */
function formatCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) return raw;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export interface CupomStore {
  name: string;
  /** Omitido/vazio: a linha do CNPJ não é impressa. */
  cnpj?: string;
}

/** Dados do estabelecimento impressos no cupom (PDV e reimpressão no histórico). */
export const STORE: CupomStore = { name: 'COSTAS BAR', cnpj: '67.968.751/0001-77' };

export function buildCupom(sale: Sale, store: CupomStore): string {
  const emittedAt = new Date(sale.completedAt ?? Date.now()).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines: string[] = [center(store.name.toUpperCase())];
  if (store.cnpj) lines.push(center(`CNPJ ${formatCnpj(store.cnpj)}`));
  lines.push(
    // center('CUPOM NAO FISCAL'),
    center(`Venda #${sale.id.slice(-6).toUpperCase()} - ${emittedAt}`),
    '='.repeat(WIDTH),
    headerRow(['#', 'CÓD.', 'DESCRIÇÃO', 'UN', 'VL.UNIT', 'VL.TOTAL']),
    '-'.repeat(WIDTH),
  );

  sale.items.forEach((item, index) => {
    lines.push(
      ...itemRows([
        String(index + 1),
        // Primeiros 5 dígitos do código de barras; sem EAN, cai para o SKU.
        (item.product.ean ?? item.product.sku).slice(0, COL.code),
        item.product.name,
        String(item.quantity),
        money.format(item.unitPrice),
        money.format(item.unitPrice * item.quantity),
      ]),
    );
  });

  lines.push('-'.repeat(WIDTH), kv('SUBTOTAL', brl(sale.subtotal)));

  // Desconto em R$ deduzido dos totais (cobre AMOUNT e PERCENT).
  const serviceFee = sale.serviceFee ?? 0;
  const discount = sale.subtotal - (sale.total - serviceFee);
  if (discount > 0.005) {
    const label =
      sale.discountType === 'PERCENT' ? `DESCONTO (${sale.discountValue}%)` : 'DESCONTO';
    lines.push(kv(label, `-${brl(discount)}`));
  }

  if (serviceFee > 0) lines.push(kv('TAXA DE SERVICO (10%)', brl(serviceFee)));

  lines.push(kv('TOTAL GERAL', brl(sale.total)), '-'.repeat(WIDTH));

  if (sale.paymentMethod) {
    lines.push(`PAGAMENTO: ${PAYMENT_METHOD_LABELS[sale.paymentMethod].toUpperCase()}`);
  }
  if (sale.amountPaid !== null) lines.push(kv('RECEBIDO', brl(sale.amountPaid)));
  if (sale.change !== null) lines.push(kv('TROCO', brl(sale.change)));
  if (sale.customer) lines.push(kv('CLIENTE', sale.customer.name.slice(0, 24)));

  lines.push(
    '='.repeat(WIDTH),
    center('Obrigado pela preferência!'),
    // center('*** SEM VALOR FISCAL ***'),
  );

  return lines.join('\n');
}
