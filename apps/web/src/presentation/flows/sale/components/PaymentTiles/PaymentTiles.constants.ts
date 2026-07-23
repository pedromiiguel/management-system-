import { PaymentMethod } from '@beverage/shared';

export const PAYMENT_TILES = [
  [PaymentMethod.CASH, 'Dinheiro', 'F5'],
  [PaymentMethod.PIX, 'PIX', 'F6'],
  [PaymentMethod.CARD, 'Cartão', 'F7'],
  [PaymentMethod.CREDIT, 'Fiado', 'F8'],
] as const;
