import { CreateProductHandler } from '@/data/handlers/products/create-product-handler';
import { CreateStockEntryHandler } from '@/data/handlers/products/create-stock-entry-handler';
import { DeactivateProductHandler } from '@/data/handlers/products/deactivate-product-handler';
import { DeleteProductHandler } from '@/data/handlers/products/delete-product-handler';
import { GetStockAlertsHandler } from '@/data/handlers/products/get-stock-alerts-handler';
import { SearchProductCatalogHandler } from '@/data/handlers/products/search-product-catalog-handler';
import { UpdateProductHandler } from '@/data/handlers/products/update-product-handler';
import { httpClient } from '@/main/factories/http/make-http-client';

export const makeSearchProductCatalog = () => new SearchProductCatalogHandler(httpClient);
export const makeGetStockAlerts = () => new GetStockAlertsHandler(httpClient);
export const makeCreateProduct = () => new CreateProductHandler(httpClient);
export const makeUpdateProduct = () => new UpdateProductHandler(httpClient);
export const makeDeactivateProduct = () => new DeactivateProductHandler(httpClient);
export const makeDeleteProduct = () => new DeleteProductHandler(httpClient);
export const makeCreateStockEntry = () => new CreateStockEntryHandler(httpClient);
