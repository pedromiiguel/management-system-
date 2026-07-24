import { createFileRoute } from '@tanstack/react-router';
import { StockPage } from '../../presentation/flows/stock/StockPage';

export const Route = createFileRoute('/_app/stock')({
  component: StockPage,
});
