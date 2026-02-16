import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { GetAccountResponseSchema, ListAccountsResponseSchema } from '../gen/schemas';
import type { UpClient } from '../helper/client';
import { AccountsApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
  } as unknown as UpClient;
}

describe('AccountsApi', () => {
  it('maps list params and cache options to GET query params', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });

    const api = new AccountsApi(client);
    await api.list(
      {
        pageSize: 25,
        filterAccountType: 'TRANSACTIONAL',
        filterOwnershipType: 'INDIVIDUAL',
      },
      { cache: false },
    );

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.ACCOUNTS, {
      responseSchema: ListAccountsResponseSchema,
      cache: false,
      query: {
        'page[size]': 25,
        'filter[accountType]': 'TRANSACTIONAL',
        'filter[ownershipType]': 'INDIVIDUAL',
      },
    });
  });

  it('retrieves account by id with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: { id: 'acc_1' } });

    const api = new AccountsApi(client);
    await api.retrieve('acc_1', { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.ACCOUNTS}/acc_1`, {
      responseSchema: GetAccountResponseSchema,
      cache: false,
    });
  });
});
