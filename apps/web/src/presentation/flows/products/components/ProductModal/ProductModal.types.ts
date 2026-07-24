import type { FieldErrors, UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { Product } from '@/domain/models/products';
import type { ProductFormInput } from './ProductModal.schema';

export type ProductModalProps = {
  product?: Product;
  onSaved: () => void;
  onClose: () => void;
};

export type ProductModalViewProps = {
  product?: Product;
  register: UseFormRegister<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  onSubmit: ReturnType<UseFormHandleSubmit<ProductFormInput>>;
  saving: boolean;
  canEnterStock: boolean;
  onDeactivate: () => void;
  onClose: () => void;
};
