import { useSalePageModel } from './SalePage.model';
import { SalePageView } from './SalePage.view';
import type { SalePageProps } from './SalePage.types';

export function SalePage({ operatorName }: SalePageProps) {
  const vm = useSalePageModel(operatorName);
  return <SalePageView {...vm} />;
}
