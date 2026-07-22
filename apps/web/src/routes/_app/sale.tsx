import { createFileRoute } from '@tanstack/react-router';
import { SalePage } from '../../presentation/sale/SalePage';
import { getUser } from '../../lib/auth';

export const Route = createFileRoute('/_app/sale')({
  component: () => <SalePage operatorName={getUser()?.name} />,
});
