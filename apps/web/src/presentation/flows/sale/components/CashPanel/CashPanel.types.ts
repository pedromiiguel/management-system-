import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type CashPanelProps = Pick<
  SalePageViewModel,
  'received' | 'onReceivedChange' | 'onReceivedEnter' | 'change'
>;
