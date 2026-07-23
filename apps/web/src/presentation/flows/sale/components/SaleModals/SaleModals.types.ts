import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type SaleModalsProps = Pick<
  SalePageViewModel,
  | 'modal'
  | 'onModalClose'
  | 'onSearchPick'
  | 'onDiscountSubmit'
  | 'onCustomerPick'
  | 'onConfirmCancelClose'
  | 'onCancelSale'
  | 'onReceiptClose'
>;
