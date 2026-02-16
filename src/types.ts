import type { z } from 'zod';
import type { components, paths } from './gen/openapi';
import { schemas } from './gen/schemas';

/**
 * Generated OpenAPI path definitions.
 */
export type UpApiPaths = paths;
/**
 * Generated OpenAPI component definitions.
 */
export type UpApiComponents = components;

/**
 * Infers a TypeScript type from a generated schema key.
 */
export type InferSchema<Name extends keyof typeof schemas> = z.infer<(typeof schemas)[Name]>;

/**
 * Pagination continuation function returned for `next` and `prev` links.
 */
export type PaginationLink<T> = null | (() => Promise<T>);

/**
 * Replaces raw pagination URLs with callable link handlers.
 */
export type WithPaginationLinks<T> = T extends { links: infer Links }
  ? Omit<T, 'links'> & {
      links: Omit<Links, 'next' | 'prev'> & {
        next: PaginationLink<T>;
        prev: PaginationLink<T>;
      };
    }
  : T;

/**
 * Parsed error payload returned by the Up API.
 */
export type ErrorResponse = InferSchema<'ErrorResponse'>;
/**
 * Single error object from the Up API error payload.
 */
export type ErrorObject = InferSchema<'ErrorObject'>;

/**
 * Legacy error facade retained for compatibility with prior SDK contracts.
 */
export type UpApiError = {
  readonly response: {
    readonly data: ErrorResponse;
    readonly status: number;
  };
};

/**
 * Money payload object containing currency code and decimal amount string.
 */
export type MoneyObject = InferSchema<'MoneyObject'>;
// Monetary values in Up use a decimal string representation (e.g. "12.34").

/**
 * Valid Up account type values.
 */
export type AccountType = components['schemas']['AccountTypeEnum'];
/**
 * Valid ownership type values.
 */
export type OwnershipType = components['schemas']['OwnershipTypeEnum'];
export type AccountResource = InferSchema<'AccountResource'>;
export type ListAccountsResponse = WithPaginationLinks<InferSchema<'ListAccountsResponse'>>;
export type GetAccountResponse = InferSchema<'GetAccountResponse'>;

/**
 * Query options for listing accounts.
 */
export type ListAccountsRequest = {
  readonly pageSize?: number;
  readonly filterAccountType?: AccountType;
  readonly filterOwnershipType?: OwnershipType;
};

export type CategoryResource = InferSchema<'CategoryResource'>;
export type ListCategoriesResponse = InferSchema<'ListCategoriesResponse'>;
export type GetCategoryResponse = InferSchema<'GetCategoryResponse'>;
export type CategoryInputResourceIdentifier = InferSchema<'CategoryInputResourceIdentifier'>;

/**
 * Query options for listing categories.
 */
export type ListCategoriesRequest = {
  readonly parent?: string;
};

export type TagResource = InferSchema<'TagResource'>;
export type TagInputResourceIdentifier = InferSchema<'TagInputResourceIdentifier'>;
export type ListTagsResponse = WithPaginationLinks<InferSchema<'ListTagsResponse'>>;
export type AttachmentResource = InferSchema<'AttachmentResource'>;
export type ListAttachmentsResponse = WithPaginationLinks<InferSchema<'ListAttachmentsResponse'>>;
export type GetAttachmentResponse = InferSchema<'GetAttachmentResponse'>;

/**
 * Query options for listing tags.
 */
export type ListTagsRequest = {
  readonly pageSize?: number;
};

/**
 * Query options for listing attachments.
 */
export type ListAttachmentsRequest = {
  readonly pageSize?: number;
};

export type TransactionStatus = components['schemas']['TransactionStatusEnum'];
export type TransactionResource = InferSchema<'TransactionResource'>;
export type ListTransactionsResponse = WithPaginationLinks<InferSchema<'ListTransactionsResponse'>>;
export type GetTransactionResponse = InferSchema<'GetTransactionResponse'>;

/**
 * Query options for listing transactions.
 */
export type ListTransactionRequest = {
  readonly pageSize?: number;
  readonly filterStatus?: TransactionStatus;
  // RFC 3339 timestamp with offset. Example: 2026-02-13T00:00:00+00:00
  readonly filterSince?: string;
  // RFC 3339 timestamp with offset. Example: 2026-02-14T00:00:00+00:00
  readonly filterUntil?: string;
  readonly filterCategory?: string;
  readonly filterTag?: string;
};

export type WebhookResource = InferSchema<'WebhookResource'>;
export type ListWebhooksResponse = WithPaginationLinks<InferSchema<'ListWebhooksResponse'>>;
export type WebhookInputResource = InferSchema<'WebhookInputResource'>;
export type CreateWebhookRequest = InferSchema<'CreateWebhookRequest'>;
export type CreateWebhookResponse = InferSchema<'CreateWebhookResponse'>;
export type GetWebhookResponse = InferSchema<'GetWebhookResponse'>;
export type WebhookEventType = InferSchema<'WebhookEventTypeEnum'>;
export type WebhookEventResource = InferSchema<'WebhookEventResource'>;
export type WebhookEventCallback = InferSchema<'WebhookEventCallback'>;
export type WebhookDeliveryStatus = InferSchema<'WebhookDeliveryStatusEnum'>;
export type WebhookDeliveryLogResource = InferSchema<'WebhookDeliveryLogResource'>;
export type ListWebhookDeliveryLogsResponse = WithPaginationLinks<
  InferSchema<'ListWebhookDeliveryLogsResponse'>
>;

/**
 * Query options for listing webhooks.
 */
export type ListWebhooksRequest = {
  readonly pageSize?: number;
};

/**
 * Utility ping response.
 */
export type Pong = InferSchema<'PingResponse'>;
