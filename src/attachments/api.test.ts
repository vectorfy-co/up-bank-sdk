import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import { GetAttachmentResponseSchema, ListAttachmentsResponseSchema } from '../gen/schemas';
import type { UpClient } from '../helper/client';
import { AttachmentsApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
  } as unknown as UpClient;
}

describe('AttachmentsApi', () => {
  it('maps list params and cache options to GET query params', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { prev: null, next: null } });

    const api = new AttachmentsApi(client);
    await api.list({ pageSize: 10 }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.ATTACHMENTS, {
      responseSchema: ListAttachmentsResponseSchema,
      cache: false,
      query: {
        'page[size]': 10,
      },
    });
  });

  it('retrieves attachment by id with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: {} });

    const api = new AttachmentsApi(client);
    await api.get('att_1', { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.ATTACHMENTS}/att_1`, {
      responseSchema: GetAttachmentResponseSchema,
      cache: false,
    });
  });
});
