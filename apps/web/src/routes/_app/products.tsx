import { createFileRoute } from '@tanstack/react-router';
import { ProductsPage } from '../../presentation/flows/products/ProductsPage';

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
});
