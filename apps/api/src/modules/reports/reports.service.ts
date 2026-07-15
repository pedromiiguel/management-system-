import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const Decimal = Prisma.Decimal;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FR-37: vendas por período, agrupadas por dia.
   * Receita é líquida de taxa de serviço (só produtos); a taxa acumulada sai
   * em `serviceFeeTotal` — ver ADR 0002.
   */
  async salesByPeriod(from: Date, to: Date) {
    const sales = await this.prisma.sale.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: from, lte: to } },
      select: { id: true, completedAt: true, total: true, serviceFee: true, paymentMethod: true },
      orderBy: { completedAt: 'asc' },
    });
    const byDay = new Map<string, { day: string; count: number; total: Prisma.Decimal }>();
    let total = new Decimal(0);
    let serviceFeeTotal = new Decimal(0);
    for (const sale of sales) {
      const fee = sale.serviceFee ?? new Decimal(0);
      const netTotal = sale.total.sub(fee);
      const day = sale.completedAt!.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { day, count: 0, total: new Decimal(0) };
      entry.count += 1;
      entry.total = entry.total.add(netTotal);
      byDay.set(day, entry);
      total = total.add(netTotal);
      serviceFeeTotal = serviceFeeTotal.add(fee);
    }
    return { days: [...byDay.values()], count: sales.length, total, serviceFeeTotal };
  }

  /** FR-38: mais vendidos. FR-39: margem por produto (preço − custo congelados). */
  async productPerformance(from: Date, to: Date) {
    const groups = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { status: 'COMPLETED', completedAt: { gte: from, lte: to } } },
      _sum: { quantity: true },
    });
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { status: 'COMPLETED', completedAt: { gte: from, lte: to } } },
      select: { productId: true, quantity: true, unitPrice: true, unitCost: true },
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: groups.map((g) => g.productId) } },
      select: { id: true, name: true, sku: true, unit: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const acc = new Map<
      string,
      { revenue: Prisma.Decimal; cost: Prisma.Decimal; quantity: number }
    >();
    for (const item of items) {
      const entry = acc.get(item.productId) ?? {
        revenue: new Decimal(0),
        cost: new Decimal(0),
        quantity: 0,
      };
      entry.revenue = entry.revenue.add(item.unitPrice.mul(item.quantity));
      entry.cost = entry.cost.add(item.unitCost.mul(item.quantity));
      entry.quantity += item.quantity;
      acc.set(item.productId, entry);
    }

    return [...acc.entries()]
      .map(([productId, e]) => ({
        product: productById.get(productId),
        quantity: e.quantity,
        revenue: e.revenue,
        cost: e.cost,
        margin: e.revenue.sub(e.cost),
        marginPercent: e.revenue.gt(0)
          ? e.revenue.sub(e.cost).div(e.revenue).mul(100).toDecimalPlaces(1)
          : new Decimal(0),
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }
}
