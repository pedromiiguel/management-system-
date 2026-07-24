import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CashMovementType, PaymentMethod } from '@beverage/shared';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Regras de negócio do financial (BR-06 caixa, BR-08 fiado, pagamento de
 * contas) — o ADR 0001 bloqueou a refatoração de `financial.tsx` até existir
 * esta cobertura (ver ADR 0006). Reseta o schema uma vez para o arquivo
 * inteiro e reaproveita o estado acumulado entre os testes, no mesmo
 * espírito de `apps/e2e/tests/support/db.ts`: o domínio (caixa, fiado) é
 * cumulativo, não faz sentido resetar por teste.
 */
function resetDatabase(): void {
  const repoRoot = path.resolve(__dirname, '../../..');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npmCmd, ['run', 'db:reset', '--workspace', 'apps/api'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Usuário consentiu explicitamente (grilling de 2026-07-23, ADR 0006) a
      // resetar este Postgres LOCAL de dev sempre que a suite precisar.
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'Sim, pode resetar (Recomendado)',
    },
  });
}

describe('Financial — regras de negócio (ADR 0001/0006)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    resetDatabase();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'admin', password: 'admin123' });
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = () => `Bearer ${token}`;

  describe('Caixa (BR-06)', () => {
    it('rejeita abrir caixa quando já existe um aberto (seed abre um com R$100)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cash-register/open')
        .set('Authorization', auth())
        .send({ openingBalance: 50 });
      expect(res.status).toBe(409);
    });

    it('acumula sangria/suprimento no saldo esperado em dinheiro', async () => {
      await request(app.getHttpServer())
        .post('/api/cash-register/movements')
        .set('Authorization', auth())
        .send({ type: CashMovementType.FLOAT, amount: 50, description: 'Suprimento' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/cash-register/movements')
        .set('Authorization', auth())
        .send({ type: CashMovementType.PULL, amount: 30, description: 'Sangria' })
        .expect(201);

      const current = await request(app.getHttpServer())
        .get('/api/cash-register/current')
        .set('Authorization', auth())
        .expect(200);
      // 100 (abertura do seed) + 50 (suprimento) − 30 (sangria) = 120
      expect(Number(current.body.summary.expectedCash)).toBe(120);
    });

    it('fecha o caixa e calcula a diferença contra o saldo esperado', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cash-register/close')
        .set('Authorization', auth())
        .send({ countedBalance: 125 })
        .expect(201);
      expect(Number(res.body.expectedBalance)).toBe(120);
      expect(Number(res.body.difference)).toBe(5);
    });

    it('rejeita movimento de caixa sem caixa aberto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cash-register/movements')
        .set('Authorization', auth())
        .send({ type: CashMovementType.FLOAT, amount: 10, description: 'x' });
      expect(res.status).toBe(404);
    });

    it('permite reabrir o caixa depois de fechado, e o fechamento anterior aparece no histórico', async () => {
      await request(app.getHttpServer())
        .post('/api/cash-register/open')
        .set('Authorization', auth())
        .send({ openingBalance: 200 })
        .expect(201);

      const history = await request(app.getHttpServer())
        .get('/api/cash-register/history')
        .set('Authorization', auth())
        .expect(200);
      const closed = history.body.find((r: { difference: number }) => Number(r.difference) === 5);
      expect(closed).toBeDefined();
    });
  });

  describe('Contas a pagar', () => {
    let payableId: string;

    it('cria uma conta a pagar em aberto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/payables')
        .set('Authorization', auth())
        .send({ description: 'Fornecedor teste', amount: 80, dueDate: new Date().toISOString() })
        .expect(201);
      payableId = res.body.id;
      expect(res.body.status).toBe('OPEN');
    });

    it('paga a conta — gera saída no caixa e marca como paga', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/payables/${payableId}/pay`)
        .set('Authorization', auth())
        .expect(201);
      expect(res.body.status).toBe('PAID');

      const from = new Date(0).toISOString();
      const to = new Date(Date.now() + 60_000).toISOString();
      const flow = await request(app.getHttpServer())
        .get('/api/financial/cash-flow')
        .query({ from, to })
        .set('Authorization', auth())
        .expect(200);
      const outflow = flow.body.movements.find((m: { description: string }) =>
        m.description.startsWith('Pagamento — Fornecedor teste'),
      );
      expect(outflow).toBeDefined();
      expect(Number(outflow.amount)).toBe(80);
    });

    it('rejeita pagar a mesma conta duas vezes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/payables/${payableId}/pay`)
        .set('Authorization', auth());
      expect(res.status).toBe(409);
    });
  });

  describe('Fiado — liquidação (BR-08)', () => {
    let receivableId: string;

    beforeAll(async () => {
      // O seed (apps/api/prisma/seed.ts) já garante um fiado em aberto de
      // R$42 para 'seed-customer-fiado' — reaproveitado aqui em vez de criado
      // ad hoc, mesma convenção da suíte E2E (support/seed-data.ts).
      const receivable = await prisma.accountReceivable.findFirstOrThrow({
        where: { customerId: 'seed-customer-fiado', status: 'OPEN' },
      });
      receivableId = receivable.id;
    });

    it('rejeita liquidar em dinheiro sem caixa aberto', async () => {
      // Fecha o caixa reaberto na suíte anterior, pra garantir que este teste
      // realmente exercita "sem caixa aberto".
      await request(app.getHttpServer())
        .post('/api/cash-register/close')
        .set('Authorization', auth())
        .send({ countedBalance: 200 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/receivables/${receivableId}/settle`)
        .set('Authorization', auth())
        .send({ paymentMethod: PaymentMethod.CASH });
      expect(res.status).toBe(409);
    });

    it('liquida via PIX e gera entrada no caixa', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/receivables/${receivableId}/settle`)
        .set('Authorization', auth())
        .send({ paymentMethod: PaymentMethod.PIX })
        .expect(201);
      expect(res.body.status).toBe('RECEIVED');

      const open = await request(app.getHttpServer())
        .get('/api/receivables')
        .query({ status: 'OPEN' })
        .set('Authorization', auth())
        .expect(200);
      expect(open.body.find((r: { id: string }) => r.id === receivableId)).toBeUndefined();
    });

    it('rejeita liquidar a mesma conta duas vezes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/receivables/${receivableId}/settle`)
        .set('Authorization', auth())
        .send({ paymentMethod: PaymentMethod.PIX });
      expect(res.status).toBe(409);
    });
  });

  describe('Lançamento avulso e visão geral', () => {
    it('cria um lançamento manual e ele aparece no fluxo de caixa do período', async () => {
      await request(app.getHttpServer())
        .post('/api/financial/entries')
        .set('Authorization', auth())
        .send({ kind: 'EXPENSE', amount: 15, description: 'Lançamento avulso teste' })
        .expect(201);

      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const flow = await request(app.getHttpServer())
        .get('/api/financial/cash-flow')
        .query({ from, to })
        .set('Authorization', auth())
        .expect(200);
      const entry = flow.body.movements.find(
        (m: { description: string }) => m.description === 'Lançamento avulso teste',
      );
      expect(entry).toBeDefined();
      expect(Number(entry.amount)).toBe(15);
    });

    it('lista as categorias financeiras seedadas', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/financial/categories')
        .set('Authorization', auth())
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(8);
      expect(res.body.some((c: { name: string }) => c.name === 'Vendas')).toBe(true);
    });

    it('dashboard reflete despesas registradas, sem vendas no seed (BR-01)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/financial/dashboard')
        .set('Authorization', auth())
        .expect(200);
      expect(Number(res.body.revenue.month)).toBe(0);
      // Payable pago (80) + lançamento avulso (15) = 95 de despesas no mês.
      expect(Number(res.body.result.expenses)).toBe(95);
      expect(Number(res.body.result.profit)).toBe(-95);
    });
  });
});
