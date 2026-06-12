import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Permission } from '@beverage/shared';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CsvColumn, toCsv } from '../../common/utils/csv';
import { StockService } from '../stock/stock.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@RequirePermission(Permission.REPORTS_READ)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly stockService: StockService,
  ) {}

  @Get('sales')
  async salesByPeriod(
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    const period = this.parsePeriod(from, to);
    const report = await this.reportsService.salesByPeriod(period.from, period.to);
    if (format === 'csv') {
      const columns: CsvColumn[] = [
        { key: 'day', label: 'Dia' },
        { key: 'count', label: 'Vendas' },
        { key: 'total', label: 'Total (R$)' },
      ];
      const rows = report.days.map((d) => ({ ...d, total: d.total.toNumber() }));
      return this.sendCsv(res, 'vendas-por-periodo.csv', toCsv(rows, columns));
    }
    return report;
  }

  /** FR-38/FR-39: mais vendidos e margem em um único relatório. */
  @Get('products')
  async productPerformance(
    @Res({ passthrough: true }) res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    const period = this.parsePeriod(from, to);
    const report = await this.reportsService.productPerformance(period.from, period.to);
    if (format === 'csv') {
      const columns: CsvColumn[] = [
        { key: 'name', label: 'Produto' },
        { key: 'sku', label: 'SKU' },
        { key: 'quantity', label: 'Qtd vendida' },
        { key: 'revenue', label: 'Receita (R$)' },
        { key: 'cost', label: 'Custo (R$)' },
        { key: 'margin', label: 'Margem (R$)' },
        { key: 'marginPercent', label: 'Margem (%)' },
      ];
      const rows = report.map((r) => ({
        name: r.product?.name,
        sku: r.product?.sku,
        quantity: r.quantity,
        revenue: r.revenue.toNumber(),
        cost: r.cost.toNumber(),
        margin: r.margin.toNumber(),
        marginPercent: r.marginPercent.toNumber(),
      }));
      return this.sendCsv(res, 'desempenho-produtos.csv', toCsv(rows, columns));
    }
    return report;
  }

  /** FR-40: posição atual de estoque. */
  @Get('stock-position')
  async stockPosition(
    @Res({ passthrough: true }) res: Response,
    @Query('format') format?: string,
  ) {
    const report = await this.stockService.position();
    if (format === 'csv') {
      const columns: CsvColumn[] = [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Produto' },
        { key: 'unit', label: 'Unidade' },
        { key: 'currentStock', label: 'Estoque' },
        { key: 'minimumStock', label: 'Mínimo' },
        { key: 'stockCost', label: 'Custo em estoque (R$)' },
        { key: 'stockValue', label: 'Valor de venda (R$)' },
      ];
      const rows = report.map((r) => ({
        ...r,
        stockCost: r.stockCost.toNumber(),
        stockValue: r.stockValue.toNumber(),
      }));
      return this.sendCsv(res, 'posicao-estoque.csv', toCsv(rows, columns));
    }
    return report;
  }

  private parsePeriod(from?: string, to?: string) {
    if (!from || !to) throw new BadRequestException('Informe o período (from/to)');
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }

  private sendCsv(res: Response, filename: string, content: string) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return content;
  }
}
