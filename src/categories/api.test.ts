import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { GetCategoryResponseSchema, ListCategoriesResponseSchema } from '../gen/schemas';
import { EmptyResponseSchema } from '../helper/client';
import type { UpClient } from '../helper/client';
import { CategoriesApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
    patch: vi.fn(),
  } as unknown as UpClient;
}

describe('CategoriesApi', () => {
  it('maps list params and cache options to GET query params', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [] });

    const api = new CategoriesApi(client);
    await api.list({ parent: 'parent_1' }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.CATEGORIES, {
      responseSchema: ListCategoriesResponseSchema,
      cache: false,
      query: { 'filter[parent]': 'parent_1' },
    });
  });

  it('retrieves category by id with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: { id: 'cat_1' } });

    const api = new CategoriesApi(client);
    await api.retrieve('cat_1', { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.CATEGORIES}/cat_1`, {
      responseSchema: GetCategoryResponseSchema,
      cache: false,
    });
  });

  it('updates transaction category and supports null payload', async () => {
    const client = createClient();
    const patchMock = vi.mocked(client.patch);
    patchMock.mockResolvedValue(undefined);

    const api = new CategoriesApi(client);
    await api.updateTransactionCategory('txn_1', null);

    expect(patchMock).toHaveBeenCalledWith(
      `${ENDPOINTS.TRANSACTIONS}/txn_1/relationships/category`,
      {
        responseSchema: EmptyResponseSchema,
        payload: null,
      },
    );
  });
});
