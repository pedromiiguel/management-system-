export interface ICancelSale {
  cancel: (saleId: string) => Promise<void>;
}
