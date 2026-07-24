import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/@contracts/http';
import { CreateFinancialEntryHandler } from './create-financial-entry-handler';

describe('CreateFinancialEntryHandler', () => {
  it('cria um lançamento avulso via POST /financial/entries', async () => {
    const entry = { id: 'e1' };
    const httpClient: IHttpClient = { request: vi.fn().mockResolvedValue({ statusCode: 201, body: entry }) };
    const handler = new CreateFinancialEntryHandler(httpClient);
    const input = { kind: 'EXPENSE' as const, amount: 15, description: 'Lançamento avulso' };

    const result = await handler.create(input);

    expect(httpClient.request).toHaveBeenCalledWith({ url: '/financial/entries', method: 'POST', body: input });
    expect(result).toBe(entry);
  });
});
