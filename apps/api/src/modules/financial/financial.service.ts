import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FinancialCategoryInput, ManualEntryInput } from '@beverage/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const Decimal = Prisma.Decimal;

@Injectable()
export class FinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * FR-29: fluxo de caixa por período. PULL/FLOAT ficam de fora — são
   * transferências internas da gaveta, não receita/despesa.
   */
  async cashFlow(from: Date, to: Date) {
    const movements = await this.prisma.cashMovement.findMany({
      where: { type: { in: ['INFLOW', 'OUTFLOW'] }, occurredAt: { gte: from, lte: to } },
      include: { category: true, sale: { select: { id: true } } },
      orderBy: { occurredAt: 'desc' },
    });
    const inflows = movements
      .filter((m) => m.type === 'INFLOW')
      .reduce((acc, m) => acc.add(m.amount), new Decimal(0));
    const outflows = movements
      .filter((m) => m.type === 'OUTFLOW')
      .reduce((acc, m) => acc.add(m.amount), new Decimal(0));
    return { movements, inflows, outflows, balance: inflows.sub(outflows) };
  }

  /** FR-35: lançamento manual avulso (fora do PDV/caixa). */
  manualEntry(input: ManualEntryInput) {
    return this.prisma.cashMovement.create({
      data: {
        type: input.kind === 'INCOME' ? 'INFLOW' : 'OUTFLOW',
        amount: new Decimal(input.amount),
        description: input.description,
        categoryId: input.categoryId,
        occurredAt: input.date ?? new Date(),
      },
      include: { category: true },
    });
  }

  listCategories() {
    return this.prisma.financialCategory.findMany({
      where: { active: true },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
  }

  createCategory(input: FinancialCategoryInput) {
    return this.prisma.financialCategory.create({ data: input });
  }

  /**
   * FR-32/33/34/36 — receita bruta dia/mês/ano-calendário (BR-01/BR-02),
   * resultado do mês e consolidação por forma de pagamento.
   */
  async dashboard() {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1); // BR-02: ano-calendário

    const [revenueDay, revenueMonth, revenueYear, byMethod, cogsMonth, expensesMonth, target] =
      await Promise.all([
        this.grossRevenue(dayStart, now),
        this.grossRevenue(monthStart, now),
        this.grossRevenue(yearStart, now),
        this.revenueByMethod(monthStart, now),
        this.cogs(monthStart, now),
        this.expenses(monthStart, now),
        this.settings.get('revenueTargetMonthly'),
      ]);

    return {
      revenue: { day: revenueDay, month: revenueMonth, year: revenueYear },
      byMethodMonth: byMethod,
      result: {
        revenue: revenueMonth,
        cogs: cogsMonth,
        expenses: expensesMonth,
        profit: revenueMonth.sub(cogsMonth).sub(expensesMonth),
      },
      target: {
        monthly: target,
        progress:
          target && target > 0 ? revenueMonth.div(new Decimal(target)).toDecimalPlaces(4) : null,
      },
    };
  }

  /** BR-01: receita bruta = soma das vendas concluídas, sem dedução. */
  private async grossRevenue(from: Date, to: Date) {
    const agg = await this.prisma.sale.aggregate({
      where: { status: 'COMPLETED', completedAt: { gte: from, lte: to } },
      _sum: { total: true },
    });
    return agg._sum.total ?? new Decimal(0);
  }

  private async revenueByMethod(from: Date, to: Date) {
    const groups = await this.prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { status: 'COMPLETED', completedAt: { gte: from, lte: to } },
      _sum: { total: true },
      _count: true,
    });
    return groups.map((g) => ({
      paymentMethod: g.paymentMethod,
      total: g._sum.total ?? new Decimal(0),
      count: g._count,
    }));
  }

  /** CMV com custo congelado no item da venda (FR-33). */
  private async cogs(from: Date, to: Date) {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { status: 'COMPLETED', completedAt: { gte: from, lte: to } } },
      select: { quantity: true, unitCost: true },
    });
    return items.reduce((acc, i) => acc.add(i.unitCost.mul(i.quantity)), new Decimal(0));
  }

  /** Despesas do período — exclui estornos de venda (saleId nulo). */
  private async expenses(from: Date, to: Date) {
    const agg = await this.prisma.cashMovement.aggregate({
      where: { type: 'OUTFLOW', saleId: null, occurredAt: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Decimal(0);
  }
}
