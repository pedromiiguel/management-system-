import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type ScanBoxProps = Pick<
  SalePageViewModel,
  | 'scanRef'
  | 'scan'
  | 'onScanChange'
  | 'onScanKeyDown'
  | 'suggestOpen'
  | 'suggestions'
  | 'highlighted'
  | 'onPickSuggestion'
>;
