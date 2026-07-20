/**
 * Espelha `apps/api/prisma/seed.ts` — único seam de dados da suíte (ver ADR
 * 0001). Os testes não criam dado em código; apenas referenciam o que o seed
 * já garante existir.
 */

export const ADMIN = { login: 'admin', password: 'admin123' };

export const CUSTOMER_NAME = 'Cliente Fiado Teste';

export const PRODUCTS = {
  skol: {
    sku: 'CRV-SKL-269',
    ean: '7891149104017',
    name: 'Cerveja Skol Lata 269ml',
    price: 3.5,
    stock: 120,
  },
  brahma: {
    sku: 'CRV-BRH-350',
    ean: '7891149010059',
    name: 'Cerveja Brahma Lata 350ml',
    price: 4.2,
    stock: 96,
  },
  heineken: {
    sku: 'CRV-HNK-330',
    ean: '7896045506873',
    name: 'Cerveja Heineken Long Neck 330ml',
    price: 7.5,
    stock: 48,
  },
  cocaCola: {
    sku: 'RFR-CCA-2L',
    ean: '7894900011517',
    name: 'Coca-Cola 2L',
    price: 10.0,
    stock: 60,
  },
  zeroStock: {
    sku: 'RFR-ZER-350',
    ean: '7891234500009',
    name: 'Refrigerante Zero Estoque 350ml',
    price: 5.0,
    stock: 0,
  },
} as const;
