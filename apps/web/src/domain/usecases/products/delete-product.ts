export interface IDeleteProduct {
  delete: (id: string) => Promise<{ deleted: boolean }>;
}
