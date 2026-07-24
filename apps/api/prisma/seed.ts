import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { ALL_PERMISSIONS, SettingKey, StockPolicy } from '@beverage/shared';

const prisma = new PrismaClient();

async function main() {
  // Papel Administrator com todas as permissões (Seção 3.1). Id fixo: o JWT é
  // stateless e embarca o id do usuário — a suíte E2E loga uma vez e reutiliza
  // o token por vários resets de schema; um id realeatorizado a cada reset
  // invalidaria esse token contra o operatorId das vendas.
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: { permissions: ALL_PERMISSIONS },
    create: { id: 'seed-role-admin', name: 'Administrador', permissions: ALL_PERMISSIONS, system: true },
  });

  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      id: 'seed-user-admin',
      name: 'Administrador',
      login: 'admin',
      passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD ?? 'admin123'),
      roleId: adminRole.id,
    },
  });

  // Categorias financeiras padrão (configuráveis — NFR-10)
  const categories: { name: string; kind: 'INCOME' | 'EXPENSE'; system?: boolean }[] = [
    { name: 'Vendas', kind: 'INCOME', system: true },
    { name: 'Recebimento de fiado', kind: 'INCOME', system: true },
    { name: 'Outras receitas', kind: 'INCOME' },
    { name: 'Fornecedores', kind: 'EXPENSE' },
    { name: 'Aluguel', kind: 'EXPENSE' },
    { name: 'Energia/Água', kind: 'EXPENSE' },
    { name: 'Salários', kind: 'EXPENSE' },
    { name: 'Outras despesas', kind: 'EXPENSE' },
  ];
  for (const c of categories) {
    await prisma.financialCategory.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, kind: c.kind, system: c.system ?? false },
    });
  }

  // Configurações padrão
  const settings: Record<string, unknown> = {
    [SettingKey.STOCK_POLICY]: StockPolicy.BLOCK,
    [SettingKey.ENABLED_PAYMENT_METHODS]: ['CASH', 'PIX', 'CARD', 'CREDIT'],
    [SettingKey.DEFAULT_MINIMUM_STOCK]: 10,
    [SettingKey.EXPIRY_ALERT_DAYS]: 30,
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }

  // Produtos de exemplo (apenas em dev — pulados se SEED_SAMPLE_DATA=false)
  if (process.env.SEED_SAMPLE_DATA !== 'false') {
    const products = [
      { sku: 'CRV-SKL-269', ean: '7891149104017', name: 'Cerveja Skol Lata 269ml', unit: 'un', purchasePrice: 2.1, salePrice: 3.5, stock: 120 },
      { sku: 'CRV-BRH-350', ean: '7891149010059', name: 'Cerveja Brahma Lata 350ml', unit: 'un', purchasePrice: 2.6, salePrice: 4.2, stock: 96 },
      { sku: 'CRV-HNK-330', ean: '7896045506873', name: 'Cerveja Heineken Long Neck 330ml', unit: 'un', purchasePrice: 4.5, salePrice: 7.5, stock: 48 },
      { sku: 'RFR-CCA-2L', ean: '7894900011517', name: 'Coca-Cola 2L', unit: 'un', purchasePrice: 6.5, salePrice: 10.0, stock: 60 },
      { sku: 'RFR-GRN-2L', ean: '7891991010856', name: 'Guaraná Antarctica 2L', unit: 'un', purchasePrice: 5.0, salePrice: 8.0, stock: 60 },
      { sku: 'AGU-MIN-500', ean: '7896098900116', name: 'Água Mineral 500ml', unit: 'un', purchasePrice: 0.8, salePrice: 2.0, stock: 200 },
      { sku: 'ENE-RBL-250', ean: '9002490100070', name: 'Red Bull 250ml', unit: 'un', purchasePrice: 6.0, salePrice: 10.0, stock: 36 },
      { sku: 'SUC-DVL-1L', ean: '7891000100103', name: 'Suco Del Valle Uva 1L', unit: 'un', purchasePrice: 5.5, salePrice: 9.0, stock: 40 },
      { sku: 'VNH-TNT-750', ean: '7891141017834', name: 'Vinho Tinto Suave 750ml', unit: 'un', purchasePrice: 12.0, salePrice: 22.0, stock: 24 },
      { sku: 'GEL-PCT-5KG', ean: null, name: 'Gelo Pacote 5kg', unit: 'pct', purchasePrice: 4.0, salePrice: 8.0, stock: 30 },
    ];
    for (const p of products) {
      const product = await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          sku: p.sku,
          ean: p.ean,
          name: p.name,
          unit: p.unit,
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice,
          currentStock: p.stock,
          minimumStock: 20,
        },
      });
      const hasEntry = await prisma.stockMovement.findFirst({ where: { productId: product.id } });
      if (!hasEntry && p.stock > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'ENTRY',
            source: 'PURCHASE',
            quantity: p.stock,
            unitCost: p.purchasePrice,
            note: 'Carga inicial (seed)',
          },
        });
      }
    }

    // Produto sem saldo — exercita o comportamento de venda sem estoque (BR-03).
    await prisma.product.upsert({
      where: { sku: 'RFR-ZER-350' },
      update: {},
      create: {
        sku: 'RFR-ZER-350',
        ean: '7891234500009',
        name: 'Refrigerante Zero Estoque 350ml',
        unit: 'un',
        purchasePrice: 3.0,
        salePrice: 5.0,
        currentStock: 0,
        minimumStock: 20,
      },
    });

    // Cliente ativo — necessário para exercitar o fluxo de fiado, que exige cliente.
    await prisma.customer.upsert({
      where: { id: 'seed-customer-fiado' },
      update: {},
      create: { id: 'seed-customer-fiado', name: 'Cliente Fiado Teste', active: true },
    });

    // Caixa aberto — venda em dinheiro exige um caixa aberto para concluir (BR-06).
    const openRegister = await prisma.cashRegister.findFirst({ where: { status: 'OPEN' } });
    if (!openRegister) {
      const admin = await prisma.user.findUnique({ where: { login: 'admin' } });
      if (admin) {
        await prisma.cashRegister.create({
          data: { operatorId: admin.id, openingBalance: 100 },
        });
      }
    }

    // Fiado em aberto — exercita a aba "Fiado (a receber)" do financeiro sem
    // depender de completar uma venda a crédito na suíte E2E (ADR 0006).
    const openReceivable = await prisma.accountReceivable.findFirst({
      where: { customerId: 'seed-customer-fiado', status: 'OPEN' },
    });
    if (!openReceivable) {
      await prisma.accountReceivable.create({
        data: { customerId: 'seed-customer-fiado', amount: 42 },
      });
    }
  }

  console.log('Seed concluído. Login: admin / senha:', process.env.ADMIN_PASSWORD ?? 'admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
