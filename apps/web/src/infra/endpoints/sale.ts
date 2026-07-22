export const saleEndpoints = {
  products: () => '/products',
  customers: () => '/customers',
  sales: () => '/sales',
  saleItems: (saleId: string) => `/sales/${saleId}/items`,
  saleItem: (saleId: string, itemId: string) => `/sales/${saleId}/items/${itemId}`,
  saleDiscount: (saleId: string) => `/sales/${saleId}/discount`,
  saleCancel: (saleId: string) => `/sales/${saleId}/cancel`,
  saleComplete: (saleId: string) => `/sales/${saleId}/complete`,
};
