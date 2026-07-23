import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type SaleTotalCardProps = Pick<
  SalePageViewModel,
  'displayTotal' | 'itemCount' | 'productCount'
>;
