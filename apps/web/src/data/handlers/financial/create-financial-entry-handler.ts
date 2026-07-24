import type { IHttpClient } from '@/@contracts/http';
import type { CashMovement, ManualEntryInput } from '@/domain/models/financial';
import type { ICreateFinancialEntry } from '@/domain/usecases/financial/create-financial-entry';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class CreateFinancialEntryHandler implements ICreateFinancialEntry {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: ManualEntryInput): Promise<CashMovement> {
    const response = await this.httpClient.request<ManualEntryInput, CashMovement>({
      url: financialEndpoints.entries(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
