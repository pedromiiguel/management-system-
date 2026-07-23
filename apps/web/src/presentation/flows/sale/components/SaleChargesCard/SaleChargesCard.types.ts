import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type SaleChargesCardProps = Pick<
  SalePageViewModel,
  | 'discountLabel'
  | 'serviceFee'
  | 'feeValue'
  | 'onToggleServiceFee'
  | 'withInvoice'
  | 'onToggleInvoice'
>;
