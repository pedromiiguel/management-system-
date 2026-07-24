import type { IHttpClient } from '@/@contracts/http';
import type { Receivable, SettleReceivableInput } from '@/domain/models/financial';
import type { ISettleReceivable } from '@/domain/usecases/financial/settle-receivable';
import { financialEndpoints } from '@/infra/endpoints/financial';

export class SettleReceivableHandler implements ISettleReceivable {
  constructor(private readonly httpClient: IHttpClient) {}

  async settle(id: string, input: SettleReceivableInput): Promise<Receivable> {
    const response = await this.httpClient.request<SettleReceivableInput, Receivable>({
      url: financialEndpoints.receivableSettle(id),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
