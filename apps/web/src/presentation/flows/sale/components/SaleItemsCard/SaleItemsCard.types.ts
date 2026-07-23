import type { SalePageViewModel } from '../../SalePage/SalePage.model';

export type SaleItemsCardProps = Pick<
  SalePageViewModel,
  | 'items'
  | 'pendingQty'
  | 'lastAddedId'
  | 'selectedItemId'
  | 'onSelectItem'
  | 'onStepQuantity'
  | 'onTypedQuantity'
  | 'onQuantityDone'
  | 'onRemoveItem'
>;
