import { ConflictException, Injectable } from '@nestjs/common';
import { SettleReceivableInput } from '@beverage/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReceivablesService {
  constructor(private readonly prisma: PrismaService) {}

  /** FR-30: pendências por cliente. */
  list(params: { customerId?: string; status?: 'OPEN' | 'RECEIVED' }) {
    return this.prisma.accountReceivable.findMany({
      where: {
        customerId: params.customerId,
        status: params.status ?? 'OPEN',
      },
      include: {
        customer: { select: { id: true, name: true, contact: true } },
        sale: { select: { id: true, completedAt: true, total: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Baixa do fiado: marca como recebido + entrada no caixa, atomicamente (BR-08). */
  settle(id: string, input: SettleReceivableInput) {
    return this.prisma.$transaction(async (tx) => {
      const receivable = await tx.accountReceivable.findUniqueOrThrow({
        where: { id },
        include: { customer: { select: { name: true } } },
      });
      if (receivable.status === 'RECEIVED') {
        throw new ConflictException('Esta conta já foi recebida');
      }
      const register = await tx.cashRegister.findFirst({ where: { status: 'OPEN' } });
      if (input.paymentMethod === 'CASH' && !register) {
        throw new ConflictException('Abra o caixa antes de receber em dinheiro');
      }
      const category = await tx.financialCategory.findUnique({
        where: { name: 'Recebimento de fiado' },
      });
      await tx.cashMovement.create({
        data: {
          cashRegisterId: register?.id,
          type: 'INFLOW',
          amount: receivable.amount,
          description: `Recebimento de fiado — ${receivable.customer.name}`,
          paymentMethod: input.paymentMethod,
          categoryId: category?.id,
        },
      });
      return tx.accountReceivable.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: { customer: { select: { id: true, name: true } } },
      });
    });
  }
}
