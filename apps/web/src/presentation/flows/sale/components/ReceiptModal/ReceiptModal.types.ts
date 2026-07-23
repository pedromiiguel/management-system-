import type { Sale } from '@/domain/models/sale';

export type ReceiptModalProps = {
  sale: Sale;
  onClose: () => void;
};

export type ReceiptModalViewProps = {
  receipt: string;
  onPrint: () => void;
  onClose: () => void;
};
