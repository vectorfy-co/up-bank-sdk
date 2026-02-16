import { UpClient } from '../helper/client';
import { EmptyResponseSchema } from '../helper/client';
import { ENDPOINTS } from '../constants';
import {
  CreateWebhookResponseSchema,
  GetWebhookResponseSchema,
  ListWebhookDeliveryLogsResponseSchema,
  ListWebhooksResponseSchema,
  WebhookEventCallbackSchema,
} from '../gen/schemas';
import type {
  CreateWebhookResponse,
  WebhookEventCallback,
  GetWebhookResponse,
  ListWebhookDeliveryLogsResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
  WebhookInputResource,
} from '../types';

type RequestBehavior = {
  cache?: boolean;
};

/**
 * Webhooks push transaction lifecycle events to your endpoint.
 */
export class WebhookApi {
  /**
   * @param api Shared low-level API client.
   */
  constructor(private readonly api: UpClient) {}

  /**
   * Retrieve configured webhooks.
   *
   * @param params Pagination options.
   * @param options Request behavior options.
   * @returns Paginated webhook collection.
   */
  public list(
    params: ListWebhooksRequest = {},
    options: RequestBehavior = {},
  ): Promise<ListWebhooksResponse> {
    return this.api.get(ENDPOINTS.WEBHOOKS, {
      responseSchema: ListWebhooksResponseSchema,
      cache: options.cache,
      query: {
        'page[size]': params.pageSize,
      },
    });
  }

  /**
   * Create a new webhook URL subscription.
   *
   * @param url Webhook destination URL.
   * @param description Optional human-readable description.
   * @returns Created webhook resource response.
   */
  public create(url: string, description?: string | null): Promise<CreateWebhookResponse> {
    const data: WebhookInputResource = {
      attributes: {
        url,
        description: description ?? null,
      },
    };

    return this.api.post<WebhookInputResource, CreateWebhookResponse>(ENDPOINTS.WEBHOOKS, {
      payload: data,
      responseSchema: CreateWebhookResponseSchema,
    });
  }

  /**
   * Retrieve a webhook by unique identifier.
   *
   * @param id Webhook identifier.
   * @param options Request behavior options.
   * @returns Webhook resource response.
   */
  public retrieve(id: string, options: RequestBehavior = {}): Promise<GetWebhookResponse> {
    return this.api.get(`${ENDPOINTS.WEBHOOKS}/${id}`, {
      responseSchema: GetWebhookResponseSchema,
      cache: options.cache,
    });
  }

  /**
   * Delete a webhook by unique identifier.
   *
   * @param id Webhook identifier.
   * @returns A promise that resolves when deletion completes.
   */
  public delete(id: string): Promise<void> {
    return this.api.delete<void, void>(`${ENDPOINTS.WEBHOOKS}/${id}`, {
      responseSchema: EmptyResponseSchema,
    });
  }

  /**
   * Send a test PING event to a webhook.
   *
   * @param id Webhook identifier.
   * @returns Typed webhook callback payload.
   */
  public ping(id: string): Promise<WebhookEventCallback> {
    return this.api.post<void, WebhookEventCallback>(`${ENDPOINTS.WEBHOOKS}/${id}/ping`, {
      responseSchema: WebhookEventCallbackSchema,
    });
  }

  /**
   * Retrieve delivery logs for a webhook.
   *
   * @param id Webhook identifier.
   * @param params Pagination options.
   * @param options Request behavior options.
   * @returns Paginated delivery log collection.
   */
  public listLogs(
    id: string,
    params: { pageSize?: number } = {},
    options: RequestBehavior = {},
  ): Promise<ListWebhookDeliveryLogsResponse> {
    return this.api.get(`${ENDPOINTS.WEBHOOKS}/${id}/logs`, {
      responseSchema: ListWebhookDeliveryLogsResponseSchema,
      cache: options.cache,
      query: {
        'page[size]': params.pageSize,
      },
    });
  }
}
