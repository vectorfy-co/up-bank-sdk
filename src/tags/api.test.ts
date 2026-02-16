import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { ListTagsResponseSchema } from '../gen/schemas';
import { EmptyResponseSchema } from '../helper/client';
import type { UpClient } from '../helper/client';
import { TagsApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  } as unknown as UpClient;
}

describe('TagsApi', () => {
  it('maps list params and cache options to GET query params', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });

    const api = new TagsApi(client);
    await api.list({ pageSize: 10 }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.TAGS, {
      responseSchema: ListTagsResponseSchema,
      cache: false,
      query: { 'page[size]': 10 },
    });
  });

  it('posts transaction tag additions', async () => {
    const client = createClient();
    const postMock = vi.mocked(client.post);
    postMock.mockResolvedValue(undefined);
    const api = new TagsApi(client);

    await api.addTagsToTransaction('txn_1', [{ type: 'tags', id: 'groceries' }]);

    expect(postMock).toHaveBeenCalledWith(`${ENDPOINTS.TRANSACTIONS}/txn_1/relationships/tags`, {
      payload: [{ type: 'tags', id: 'groceries' }],
      responseSchema: EmptyResponseSchema,
    });
  });

  it('deletes transaction tag relationships', async () => {
    const client = createClient();
    const deleteMock = vi.mocked(client.delete);
    deleteMock.mockResolvedValue(undefined);
    const api = new TagsApi(client);

    await api.removeTagsFromTransaction('txn_1', [{ type: 'tags', id: 'groceries' }]);

    expect(deleteMock).toHaveBeenCalledWith(`${ENDPOINTS.TRANSACTIONS}/txn_1/relationships/tags`, {
      payload: [{ type: 'tags', id: 'groceries' }],
      responseSchema: EmptyResponseSchema,
    });
  });
});
