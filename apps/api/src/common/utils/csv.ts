export interface CsvColumn {
  key: string;
  label: string;
}

/** Gera CSV com BOM (Excel pt-BR) e ponto-e-vírgula como separador. */
export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const s =
      typeof value === 'number'
        ? value.toFixed(2).replace('.', ',')
        : value instanceof Date
          ? value.toLocaleString('pt-BR')
          : String(value);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(';');
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(';'));
  return '﻿' + [header, ...body].join('\n');
}
