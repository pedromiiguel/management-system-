import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CustomerInput } from '@beverage/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Inclui saldo devedor em aberto por cliente (FR-30). */
  async list(search?: string) {
    const customers = await this.prisma.customer.findMany({
      where: {
        active: true,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
    const balances = await this.prisma.accountReceivable.groupBy({
      by: ['customerId'],
      where: { status: 'OPEN' },
      _sum: { amount: true },
    });
    const balanceByCustomer = new Map(
      balances.map((b) => [b.customerId, b._sum.amount ?? new Prisma.Decimal(0)]),
    );
    return customers.map((c) => ({
      ...c,
      openBalance: balanceByCustomer.get(c.id) ?? new Prisma.Decimal(0),
    }));
  }

  create(input: CustomerInput) {
    return this.prisma.customer.create({ data: input });
  }

  update(id: string, input: CustomerInput) {
    return this.prisma.customer.update({ where: { id }, data: input });
  }

  deactivate(id: string) {
    return this.prisma.customer.update({ where: { id }, data: { active: false } });
  }
}
