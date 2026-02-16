import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { GetTransactionResponseSchema, ListTransactionsResponseSchema } from '../gen/schemas';
import type { UpClient } from '../helper/client';
import { TransactionsApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
  } as unknown as UpClient;
}

describe('TransactionsApi', () => {
  it('maps list params and cache options to query params', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });
    const api = new TransactionsApi(client);

    await api.list(
      {
        pageSize: 50,
        filterStatus: 'HELD',
        filterSince: '2026-01-01T00:00:00+00:00',
        filterUntil: '2026-01-31T00:00:00+00:00',
        filterCategory: 'cat_1',
        filterTag: 'groceries',
      },
      { cache: false },
    );

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.TRANSACTIONS, {
      responseSchema: ListTransactionsResponseSchema,
      cache: false,
      query: {
        'page[size]': 50,
        'filter[status]': 'HELD',
        'filter[since]': '2026-01-01T00:00:00+00:00',
        'filter[until]': '2026-01-31T00:00:00+00:00',
        'filter[category]': 'cat_1',
        'filter[tag]': 'groceries',
      },
    });
  });

  it('retrieves a transaction by id with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: { id: 'txn_1' } });
    const api = new TransactionsApi(client);

    await api.retrieve('txn_1', { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.TRANSACTIONS}/txn_1`, {
      responseSchema: GetTransactionResponseSchema,
      cache: false,
    });
  });

  it('lists account-scoped transactions with mapped filters', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });
    const api = new TransactionsApi(client);

    await api.listByAccount('acc_1', { pageSize: 20, filterTag: 'fuel' }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.ACCOUNTS}/acc_1/${ENDPOINTS.TRANSACTIONS}`, {
      responseSchema: ListTransactionsResponseSchema,
      cache: false,
      query: {
        'page[size]': 20,
        'filter[status]': undefined,
        'filter[since]': undefined,
        'filter[until]': undefined,
        'filter[category]': undefined,
        'filter[tag]': 'fuel',
      },
    });
  });
});
