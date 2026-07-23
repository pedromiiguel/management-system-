import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type CreditPanelProps = Pick<SalePageViewModel, 'customer' | 'onOpenCustomer'>;
