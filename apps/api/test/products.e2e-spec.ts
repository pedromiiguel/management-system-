import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaymentMethod, Permission } from '@beverage/shared';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Regras de negócio de `products` com ramificação real (ADR 0007): BR-04
 * (bloqueio de exclusão com venda) e a permissão dupla (PRODUCTS_WRITE +
 * STOCK_WRITE) na entrada de estoque embutida. A transação de
 * `applyStockEntry` e a normalização de EAN ficam fora deste gate por
 * decisão explícita — cobertas por teste unitário de handler na fase 3.
 * Reset de schema único para o arquivo, mesmo padrão de `financial.e2e-spec.ts`.
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

describe('Products — regras de negócio (ADR 0007)', () => {
  let app: INestApplication;
  let adminToken: string;
  /** Papel só com PRODUCTS_WRITE (sem STOCK_WRITE), criado via API — exercita a guarda dupla. */
  let productsOnlyToken: string;

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

    const role = await request(app.getHttpServer())
      .post('/api/users/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cadastro de produtos (teste)', permissions: [Permission.PRODUCTS_WRITE] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sem estoque',
        login: 'sem-estoque',
        password: 'senha123',
        roleId: role.body.id,
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ login: 'sem-estoque', password: 'senha123' });
    productsOnlyToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => `Bearer ${token}`;

  describe('Permissão dupla na entrada de estoque embutida', () => {
    it('permite criar produto sem stockEntry só com products.write', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(productsOnlyToken))
        .send({ name: 'Produto sem entrada', sku: 'TEST-SEM-ENTRADA', unit: 'un', purchasePrice: 1, salePrice: 2, minimumStock: 0 })
        .expect(201);
    });

    it('rejeita stockEntry quando falta stock.write', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(productsOnlyToken))
        .send({
          name: 'Produto com entrada negada',
          sku: 'TEST-ENTRADA-NEGADA',
          unit: 'un',
          purchasePrice: 1,
          salePrice: 2,
          minimumStock: 0,
          stockEntry: { quantity: 10 },
        });
      expect(res.status).toBe(403);
    });

    it('permite stockEntry quando o usuário tem products.write e stock.write', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(adminToken))
        .send({
          name: 'Produto com entrada permitida',
          sku: 'TEST-ENTRADA-OK',
          unit: 'un',
          purchasePrice: 1,
          salePrice: 2,
          minimumStock: 0,
          stockEntry: { quantity: 10 },
        })
        .expect(201);
    });

    it('mesma guarda vale para edição (update)', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(adminToken))
        .send({ name: 'Produto para editar', sku: 'TEST-EDITAR', unit: 'un', purchasePrice: 1, salePrice: 2, minimumStock: 0 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/products/${created.body.id}`)
        .set('Authorization', auth(productsOnlyToken))
        .send({ stockEntry: { quantity: 5 } });
      expect(res.status).toBe(403);
    });
  });

  describe('BR-04: bloqueio de exclusão de produto com venda registrada', () => {
    it('permite excluir produto sem venda registrada', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(adminToken))
        .send({ name: 'Produto sem venda', sku: 'TEST-SEM-VENDA', unit: 'un', purchasePrice: 1, salePrice: 2, minimumStock: 0 })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/products/${created.body.id}`)
        .set('Authorization', auth(adminToken))
        .expect(200);
    });

    it('rejeita excluir produto com venda registrada', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', auth(adminToken))
        .send({
          name: 'Produto com venda',
          sku: 'TEST-COM-VENDA',
          unit: 'un',
          purchasePrice: 1,
          salePrice: 2,
          minimumStock: 0,
          stockEntry: { quantity: 10 },
        })
        .expect(201);

      const sale = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', auth(adminToken))
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/sales/${sale.body.id}/items`)
        .set('Authorization', auth(adminToken))
        .send({ code: 'TEST-COM-VENDA', quantity: 1 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/sales/${sale.body.id}/complete`)
        .set('Authorization', auth(adminToken))
        .send({ paymentMethod: PaymentMethod.PIX })
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/api/products/${created.body.id}`)
        .set('Authorization', auth(adminToken));
      expect(res.status).toBe(400);
    });
  });
});
