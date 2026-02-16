import { describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '../constants';
import {
  CreateWebhookResponseSchema,
  GetWebhookResponseSchema,
  ListWebhookDeliveryLogsResponseSchema,
  ListWebhooksResponseSchema,
  WebhookEventCallbackSchema,
} from '../gen/schemas';
import { EmptyResponseSchema } from '../helper/client';
import type { UpClient } from '../helper/client';
import { WebhookApi } from './api';

function createClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  } as unknown as UpClient;
}

describe('WebhookApi', () => {
  it('lists webhooks with pagination query and cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });
    const api = new WebhookApi(client);

    await api.list({ pageSize: 15 }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(ENDPOINTS.WEBHOOKS, {
      responseSchema: ListWebhooksResponseSchema,
      cache: false,
      query: { 'page[size]': 15 },
    });
  });

  it('creates webhook payload with null description default', async () => {
    const client = createClient();
    const postMock = vi.mocked(client.post);
    postMock.mockResolvedValue({ data: { id: 'wh_1' } });
    const api = new WebhookApi(client);

    await api.create('https://example.com/hook');

    expect(postMock).toHaveBeenCalledWith(ENDPOINTS.WEBHOOKS, {
      payload: {
        attributes: {
          url: 'https://example.com/hook',
          description: null,
        },
      },
      responseSchema: CreateWebhookResponseSchema,
    });
  });

  it('retrieves webhook by id with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: { id: 'wh_1' } });
    const api = new WebhookApi(client);

    await api.retrieve('wh_1', { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.WEBHOOKS}/wh_1`, {
      responseSchema: GetWebhookResponseSchema,
      cache: false,
    });
  });

  it('deletes and pings webhook endpoints', async () => {
    const client = createClient();
    const deleteMock = vi.mocked(client.delete);
    const postMock = vi.mocked(client.post);
    deleteMock.mockResolvedValue(undefined);
    postMock.mockResolvedValue({ data: { id: 'evt_1' } });
    const api = new WebhookApi(client);

    await api.delete('wh_1');
    await api.ping('wh_1');

    expect(deleteMock).toHaveBeenCalledWith(`${ENDPOINTS.WEBHOOKS}/wh_1`, {
      responseSchema: EmptyResponseSchema,
    });
    expect(postMock).toHaveBeenCalledWith(`${ENDPOINTS.WEBHOOKS}/wh_1/ping`, {
      responseSchema: WebhookEventCallbackSchema,
    });
  });

  it('lists webhook logs with cache controls', async () => {
    const client = createClient();
    const getMock = vi.mocked(client.get);
    getMock.mockResolvedValue({ data: [], links: { next: null, prev: null } });
    const api = new WebhookApi(client);

    await api.listLogs('wh_1', { pageSize: 30 }, { cache: false });

    expect(getMock).toHaveBeenCalledWith(`${ENDPOINTS.WEBHOOKS}/wh_1/logs`, {
      responseSchema: ListWebhookDeliveryLogsResponseSchema,
      cache: false,
      query: { 'page[size]': 30 },
    });
  });
});
