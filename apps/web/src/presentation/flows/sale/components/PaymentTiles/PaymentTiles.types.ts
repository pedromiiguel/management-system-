import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type PaymentTilesProps = Pick<SalePageViewModel, 'payment' | 'onSelectPayment'>;
