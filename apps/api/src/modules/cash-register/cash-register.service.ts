import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CashMovementInput, CloseRegisterInput, OpenRegisterInput } from '@beverage/shared';
import { PrismaService } from '../../prisma/prisma.service';

const Decimal = Prisma.Decimal;

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent() {
    const register = await this.prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: {
        operator: { select: { id: true, name: true } },
        movements: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!register) return null;
    return { ...register, summary: this.summarize(register) };
  }

  async open(operatorId: string, input: OpenRegisterInput) {
    const existing = await this.prisma.cashRegister.findFirst({ where: { status: 'OPEN' } });
    if (existing) throw new ConflictException('Já existe um caixa aberto — feche-o primeiro');
    return this.prisma.cashRegister.create({
      data: { operatorId, openingBalance: new Decimal(input.openingBalance) },
      include: { operator: { select: { id: true, name: true } } },
    });
  }

  /** Sangria (PULL), suprimento (FLOAT) e despesas pagas pelo caixa (OUTFLOW). */
  async addMovement(input: CashMovementInput) {
    const register = await this.requireOpen();
    return this.prisma.cashMovement.create({
      data: {
        cashRegisterId: register.id,
        type: input.type,
        amount: new Decimal(input.amount),
        description: input.description,
        categoryId: input.categoryId,
        // Movimentos manuais do caixa são sempre em dinheiro físico.
        paymentMethod: 'CASH',
      },
    });
  }

  /** BR-06: confere o saldo contado contra o calculado e registra a diferença. */
  async close(input: CloseRegisterInput) {
    const register = await this.requireOpen();
    const full = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id: register.id },
      include: { movements: true },
    });
    const expected = this.expectedCashBalance(full);
    const counted = new Decimal(input.countedBalance);
    return this.prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        expectedBalance: expected,
        countedBalance: counted,
        difference: counted.sub(expected),
        note: input.note,
      },
      include: { operator: { select: { id: true, name: true } } },
    });
  }

  listHistory() {
    return this.prisma.cashRegister.findMany({
      where: { status: 'CLOSED' },
      orderBy: { openedAt: 'desc' },
      include: { operator: { select: { id: true, name: true } } },
      take: 60,
    });
  }

  private async requireOpen() {
    const register = await this.prisma.cashRegister.findFirst({ where: { status: 'OPEN' } });
    if (!register) throw new NotFoundException('Nenhum caixa aberto');
    return register;
  }

  /** Dinheiro físico na gaveta: abertura + entradas CASH − saídas CASH + suprimentos − sangrias. */
  private expectedCashBalance(register: {
    openingBalance: Prisma.Decimal;
    movements: { type: string; amount: Prisma.Decimal; paymentMethod: string | null }[];
  }) {
    return register.movements.reduce((acc, m) => {
      if (m.type === 'FLOAT') return acc.add(m.amount);
      if (m.type === 'PULL') return acc.sub(m.amount);
      if (m.paymentMethod !== 'CASH') return acc; // PIX/cartão não entram na gaveta
      return m.type === 'INFLOW' ? acc.add(m.amount) : acc.sub(m.amount);
    }, register.openingBalance);
  }

  /** Resumo do turno por forma de pagamento + saldo esperado em dinheiro (FR-34). */
  private summarize(register: {
    openingBalance: Prisma.Decimal;
    movements: { type: string; amount: Prisma.Decimal; paymentMethod: string | null }[];
  }) {
    const byMethod: Record<string, Prisma.Decimal> = {};
    let pulls = new Decimal(0);
    let floats = new Decimal(0);
    let outflows = new Decimal(0);
    for (const m of register.movements) {
      if (m.type === 'INFLOW' && m.paymentMethod) {
        byMethod[m.paymentMethod] = (byMethod[m.paymentMethod] ?? new Decimal(0)).add(m.amount);
      } else if (m.type === 'PULL') pulls = pulls.add(m.amount);
      else if (m.type === 'FLOAT') floats = floats.add(m.amount);
      else if (m.type === 'OUTFLOW') outflows = outflows.add(m.amount);
    }
    return {
      inflowsByMethod: byMethod,
      pulls,
      floats,
      outflows,
      expectedCash: this.expectedCashBalance(register),
    };
  }
}
