import type { IHttpClient } from '@/@contracts/http';
import type { CompleteSaleInput, Sale } from '@/domain/models/sale';
import type { ICompleteSale } from '@/domain/usecases/sale/complete-sale';
import { saleEndpoints } from '@/infra/endpoints/sale';

export class CompleteSaleHandler implements ICompleteSale {
  constructor(private readonly httpClient: IHttpClient) {}

  async complete(saleId: string, input: CompleteSaleInput): Promise<Sale> {
    const response = await this.httpClient.request<CompleteSaleInput, Sale>({
      url: saleEndpoints.saleComplete(saleId),
      method: 'POST',
      body: input,
    });
    return response.body;
  }
}
