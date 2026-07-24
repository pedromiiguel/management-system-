export interface IGetSalesTotal {
  get: (from: string, to: string) => Promise<{ total: number }>;
}
