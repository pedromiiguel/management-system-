export const productsEndpoints = {
  products: () => '/products',
  product: (id: string) => `/products/${id}`,
  productDeactivate: (id: string) => `/products/${id}/deactivate`,
};
