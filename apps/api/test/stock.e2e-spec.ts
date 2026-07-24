import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Regra de negócio de `stock` com ramificação real (ADR 0008): a guarda de
 * estoque negativo em `createAdjustment` (updateMany atômico, throw se o
 * ajuste deixaria currentStock < 0). A transação de `createEntry` (FR-05)
 * fica fora deste gate por precedente já fixado na ADR 0007 (mesmo endpoint
 * POST /stock/entries, não redecidido aqui). Reset de schema único para o
 * arquivo, mesmo padrão de `products.e2e-spec.ts`.
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
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'Sim, pode resetar (Recomendado)',
    },
  });
}

describe('Stock — regras de negócio (ADR 0008)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    resetDatabase();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => `Bearer ${token}`;

  async function createProductWithStock(sku: string, quantity: number) {
    const created = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', auth(adminToken))
      .send({
        name: `Produto ${sku}`,
        sku,
        unit: 'un',
        purchasePrice: 1,
        salePrice: 2,
        minimumStock: 0,
        stockEntry: { quantity },
      })
      .expect(201);
    return created.body.id as string;
  }

  describe('Guarda de estoque negativo em POST /stock/adjustments', () => {
    it('rejeita ajuste que deixaria o estoque negativo', async () => {
      const productId = await createProductWithStock('TEST-AJUSTE-NEG', 5);

      const res = await request(app.getHttpServer())
        .post('/api/stock/adjustments')
        .set('Authorization', auth(adminToken))
        .send({ productId, quantity: -10, reason: 'contagem de inventário' });

      expect(res.status).toBe(400);
    });

    it('permite ajuste negativo que não deixa o estoque negativo', async () => {
      const productId = await createProductWithStock('TEST-AJUSTE-OK', 5);

      await request(app.getHttpServer())
        .post('/api/stock/adjustments')
        .set('Authorization', auth(adminToken))
        .send({ productId, quantity: -3, reason: 'quebra' })
        .expect(201);
    });

    it('caso limite: ajuste que zera o estoque exatamente é aceito', async () => {
      const productId = await createProductWithStock('TEST-AJUSTE-ZERO', 5);

      await request(app.getHttpServer())
        .post('/api/stock/adjustments')
        .set('Authorization', auth(adminToken))
        .send({ productId, quantity: -5, reason: 'perda total' })
        .expect(201);
    });

    it('permite ajuste positivo sem restrição', async () => {
      const productId = await createProductWithStock('TEST-AJUSTE-POS', 5);

      await request(app.getHttpServer())
        .post('/api/stock/adjustments')
        .set('Authorization', auth(adminToken))
        .send({ productId, quantity: 10, reason: 'contagem de inventário' })
        .expect(201);
    });
  });
});
