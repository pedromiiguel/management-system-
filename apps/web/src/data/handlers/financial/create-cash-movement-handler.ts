import type { IHttpClient } from '@/@contracts/http';
import type { CashMovement, CashMovementInput } from '@/domain/models/financial';
import type { ICreateCashMovement } from '@/domain/usecases/financial/create-cash-movement';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class CreateCashMovementHandler implements ICreateCashMovement {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(input: CashMovementInput): Promise<CashMovement> {
    const response = await this.httpClient.request<CashMovementInput, CashMovement>({
      url: financialEndpoints.cashRegisterMovements(),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
