import { CreateStockAdjustmentHandler } from '@/data/handlers/stock/create-stock-adjustment-handler';
import { CreateStockEntryHandler } from '@/data/handlers/stock/create-stock-entry-handler';
import { GetStockAlertsHandler } from '@/data/handlers/stock/get-stock-alerts-handler';
import { SearchStockMovementsHandler } from '@/data/handlers/stock/search-stock-movements-handler';
import { httpClient } from '@/main/factories/http/make-http-client';

export const makeGetStockAlerts = () => new GetStockAlertsHandler(httpClient);
export const makeCreateStockEntry = () => new CreateStockEntryHandler(httpClient);
export const makeCreateStockAdjustment = () => new CreateStockAdjustmentHandler(httpClient);
export const makeSearchStockMovements = () => new SearchStockMovementsHandler(httpClient);
