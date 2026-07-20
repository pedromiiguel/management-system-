const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const cupomMoneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Espelha `apps/web/src/lib/format.ts#formatBRL` (telas do PDV) — usa espaço fino U+00A0. */
export function brl(value: number): string {
  return brlFormatter.format(value);
}

/** Espelha `apps/web/src/lib/cupom.ts#brl` (texto do cupom) — usa espaço comum. */
export function cupomBrl(value: number): string {
  return `R$ ${cupomMoneyFormatter.format(value)}`;
}
