import { AccountsApi } from './accounts/api';
import { CategoriesApi } from './categories/api';
import { AttachmentsApi } from './attachments/api';
import { UpClient } from './helper/client';
import type { UpClientOptions } from './helper/client';
import { UpRawApi } from './raw';
import { TagsApi } from './tags/api';
import { TransactionsApi } from './transactions/api';
import { UtilApi } from './util/api';
import { WebhookApi } from './webhooks/api';

/**
 * Primary ergonomic SDK entry point.
 */
export class UpApi {
  public readonly util: UtilApi;
  public readonly accounts: AccountsApi;
  public readonly categories: CategoriesApi;
  public readonly attachments: AttachmentsApi;
  public readonly transactions: TransactionsApi;
  public readonly tags: TagsApi;
  public readonly webhooks: WebhookApi;
  public readonly raw: UpRawApi;

  private readonly api: UpClient;

  /**
   * Creates the primary SDK client.
   *
   * @param apiKeyOrOptions API key string, detailed client options, or null for defaults.
   */
  constructor(apiKeyOrOptions: string | UpClientOptions | null = null) {
    const options = normalizeClientOptions(apiKeyOrOptions);
    this.api = new UpClient(options);

    this.util = new UtilApi(this.api);
    this.accounts = new AccountsApi(this.api);
    this.categories = new CategoriesApi(this.api);
    this.attachments = new AttachmentsApi(this.api);
    this.transactions = new TransactionsApi(this.api);
    this.tags = new TagsApi(this.api);
    this.webhooks = new WebhookApi(this.api);
    this.raw = new UpRawApi(this.api);
  }

  /**
   * Swap in a new access token at runtime.
   *
   * @param apiKey New bearer token.
   */
  public updateApiKey(apiKey: string): void {
    this.api.updateApiKey(apiKey);
  }

  /**
   * Access the underlying query client for advanced cache control.
   *
   * @returns The internal TanStack Query client instance.
   */
  public getQueryClient() {
    return this.api.getQueryClient();
  }
}

/**
 * Normalizes constructor input into {@link UpClientOptions}.
 *
 * @param value API key or option bag.
 * @returns Normalized client options.
 */
function normalizeClientOptions(value: string | UpClientOptions | null): UpClientOptions {
  if (typeof value === 'string') {
    return { apiKey: value };
  }

  if (value === null) {
    return {};
  }

  return value;
}

export { UpRawApi } from './raw';

export {
  assertVerifiedWebhookEvent,
  parseAndValidateWebhookEvent,
  verifyWebhookSignature,
} from './webhooks/security';

export { isUpApiError } from './utilities';
export { UpApiHttpError, isUpApiHttpError } from './errors';

export * from './helper/client';
export * from './types';
export * from './zod';
export * from './generated';
