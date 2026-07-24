import { createFileRoute } from '@tanstack/react-router';
import { FinancialPage } from '../../presentation/flows/financial/FinancialPage';

export const Route = createFileRoute('/_app/financial')({
  component: FinancialPage,
});
