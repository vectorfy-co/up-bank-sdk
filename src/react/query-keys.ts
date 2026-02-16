import type {
  ListAccountsRequest,
  ListCategoriesRequest,
  ListTagsRequest,
  ListTransactionRequest,
  ListWebhooksRequest,
} from '../types';

/**
 * Default cache scope for query key generation.
 */
export const DEFAULT_QUERY_SCOPE_KEY = 'default';

/**
 * Stable query-key builders used by React Query hooks.
 */
export const upQueryKeys = {
  scope: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) => ['up-sdk', scopeKey] as const,
  accounts: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.scope(scopeKey), 'accounts'] as const,
    list: (params: ListAccountsRequest, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.accounts.all(scopeKey), 'list', params] as const,
    detail: (accountId: string, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.accounts.all(scopeKey), 'detail', accountId] as const,
  },
  categories: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.scope(scopeKey), 'categories'] as const,
    list: (params: ListCategoriesRequest, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.categories.all(scopeKey), 'list', params] as const,
    detail: (categoryId: string, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.categories.all(scopeKey), 'detail', categoryId] as const,
  },
  tags: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) => [...upQueryKeys.scope(scopeKey), 'tags'] as const,
    list: (params: ListTagsRequest, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.tags.all(scopeKey), 'list', params] as const,
  },
  transactions: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.scope(scopeKey), 'transactions'] as const,
    list: (params: ListTransactionRequest, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.transactions.all(scopeKey), 'list', params] as const,
    byAccount: (
      accountId: string,
      params: ListTransactionRequest,
      scopeKey = DEFAULT_QUERY_SCOPE_KEY,
    ) => [...upQueryKeys.transactions.all(scopeKey), 'by-account', accountId, params] as const,
    detail: (transactionId: string, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.transactions.all(scopeKey), 'detail', transactionId] as const,
  },
  util: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) => [...upQueryKeys.scope(scopeKey), 'util'] as const,
    ping: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.util.all(scopeKey), 'ping'] as const,
  },
  webhooks: {
    all: (scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.scope(scopeKey), 'webhooks'] as const,
    list: (params: ListWebhooksRequest, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.webhooks.all(scopeKey), 'list', params] as const,
    detail: (webhookId: string, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.webhooks.all(scopeKey), 'detail', webhookId] as const,
    logs: (webhookId: string, params: { pageSize?: number }, scopeKey = DEFAULT_QUERY_SCOPE_KEY) =>
      [...upQueryKeys.webhooks.all(scopeKey), 'logs', webhookId, params] as const,
  },
} as const;
