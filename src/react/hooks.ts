import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { UpApi } from '../index';
import { UpApiHttpError } from '../errors';
import type {
  CategoryInputResourceIdentifier,
  CreateWebhookResponse,
  ListAccountsRequest,
  ListCategoriesRequest,
  ListTagsRequest,
  ListTransactionRequest,
  ListWebhooksRequest,
  TagInputResourceIdentifier,
  WebhookEventCallback,
} from '../types';
import { DEFAULT_QUERY_SCOPE_KEY, upQueryKeys } from './query-keys';

/**
 * Shared query hook options supported across read hooks.
 */
type UpQueryHookOptions = {
  scopeKey?: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
};

/**
 * Shared mutation hook options supported across write hooks.
 */
type UpMutationHookOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, UpApiHttpError, TVariables>,
  'mutationFn' | 'mutationKey'
> & {
  scopeKey?: string;
};

/**
 * Maps ergonomic query hook options to React Query options.
 */
function toQueryOverrides<TData>(
  options: Omit<UpQueryHookOptions, 'scopeKey'>,
): Omit<UseQueryOptions<TData, UpApiHttpError, TData>, 'queryKey' | 'queryFn'> {
  const overrides: Omit<UseQueryOptions<TData, UpApiHttpError, TData>, 'queryKey' | 'queryFn'> = {};

  if (options.enabled !== undefined) overrides.enabled = options.enabled;
  if (options.staleTime !== undefined) overrides.staleTime = options.staleTime;
  if (options.gcTime !== undefined) overrides.gcTime = options.gcTime;
  if (options.retry !== undefined) overrides.retry = options.retry;
  if (options.refetchOnWindowFocus !== undefined) {
    overrides.refetchOnWindowFocus = options.refetchOnWindowFocus;
  }
  if (options.refetchOnReconnect !== undefined) {
    overrides.refetchOnReconnect = options.refetchOnReconnect;
  }
  if (options.refetchOnMount !== undefined) {
    overrides.refetchOnMount = options.refetchOnMount;
  }

  return overrides;
}

/**
 * Builds typed query options with standardized Up SDK error typing.
 */
function createUpQueryOptions<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options: Omit<UpQueryHookOptions, 'scopeKey'>,
) {
  return queryOptions<TData, UpApiHttpError>({
    queryKey,
    queryFn,
    ...toQueryOverrides(options),
  });
}

/**
 * React Query hook for listing accounts.
 */
export function useAccountsList(
  up: UpApi,
  params: ListAccountsRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.accounts.list(params, scopeKey),
      async () => await up.accounts.list(params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for retrieving one account.
 */
export function useAccount(up: UpApi, accountId: string, options: UpQueryHookOptions = {}) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.accounts.detail(accountId, scopeKey),
      async () => await up.accounts.retrieve(accountId, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing categories.
 */
export function useCategoriesList(
  up: UpApi,
  params: ListCategoriesRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.categories.list(params, scopeKey),
      async () => await up.categories.list(params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for retrieving one category.
 */
export function useCategory(up: UpApi, categoryId: string, options: UpQueryHookOptions = {}) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.categories.detail(categoryId, scopeKey),
      async () => await up.categories.retrieve(categoryId, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing all transactions.
 */
export function useTransactionsList(
  up: UpApi,
  params: ListTransactionRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.transactions.list(params, scopeKey),
      async () => await up.transactions.list(params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing transactions by account.
 */
export function useAccountTransactions(
  up: UpApi,
  accountId: string,
  params: ListTransactionRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.transactions.byAccount(accountId, params, scopeKey),
      async () => await up.transactions.listByAccount(accountId, params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for retrieving one transaction.
 */
export function useTransaction(up: UpApi, transactionId: string, options: UpQueryHookOptions = {}) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.transactions.detail(transactionId, scopeKey),
      async () => await up.transactions.retrieve(transactionId, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing tags.
 */
export function useTagsList(
  up: UpApi,
  params: ListTagsRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.tags.list(params, scopeKey),
      async () => await up.tags.list(params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing webhooks.
 */
export function useWebhooksList(
  up: UpApi,
  params: ListWebhooksRequest = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.webhooks.list(params, scopeKey),
      async () => await up.webhooks.list(params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for retrieving one webhook.
 */
export function useWebhook(up: UpApi, webhookId: string, options: UpQueryHookOptions = {}) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.webhooks.detail(webhookId, scopeKey),
      async () => await up.webhooks.retrieve(webhookId, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for listing webhook delivery logs.
 */
export function useWebhookLogs(
  up: UpApi,
  webhookId: string,
  params: { pageSize?: number } = {},
  options: UpQueryHookOptions = {},
) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.webhooks.logs(webhookId, params, scopeKey),
      async () => await up.webhooks.listLogs(webhookId, params, { cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * React Query hook for API ping endpoint.
 */
export function usePing(up: UpApi, options: UpQueryHookOptions = {}) {
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...queryOverrides } = options;

  return useQuery(
    createUpQueryOptions(
      upQueryKeys.util.ping(scopeKey),
      async () => await up.util.ping({ cache: false }),
      queryOverrides,
    ),
  );
}

/**
 * Mutation hook for updating a transaction category.
 */
export function useUpdateTransactionCategory(
  up: UpApi,
  options: UpMutationHookOptions<
    void,
    { transactionId: string; category: CategoryInputResourceIdentifier | null }
  > = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) =>
      await up.categories.updateTransactionCategory(variables.transactionId, variables.category),
    options,
  );
}

/**
 * Mutation hook for adding tags to a transaction.
 */
export function useAddTransactionTags(
  up: UpApi,
  options: UpMutationHookOptions<
    void,
    { transactionId: string; tags: TagInputResourceIdentifier[] }
  > = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) =>
      await up.tags.addTagsToTransaction(variables.transactionId, variables.tags),
    options,
  );
}

/**
 * Mutation hook for removing tags from a transaction.
 */
export function useRemoveTransactionTags(
  up: UpApi,
  options: UpMutationHookOptions<
    void,
    { transactionId: string; tags: TagInputResourceIdentifier[] }
  > = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) =>
      await up.tags.removeTagsFromTransaction(variables.transactionId, variables.tags),
    options,
  );
}

/**
 * Mutation hook for creating a webhook.
 */
export function useCreateWebhook(
  up: UpApi,
  options: UpMutationHookOptions<
    CreateWebhookResponse,
    { url: string; description?: string | null }
  > = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) => await up.webhooks.create(variables.url, variables.description),
    options,
  );
}

/**
 * Mutation hook for deleting a webhook.
 */
export function useDeleteWebhook(
  up: UpApi,
  options: UpMutationHookOptions<void, { id: string }> = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) => await up.webhooks.delete(variables.id),
    options,
  );
}

/**
 * Mutation hook for pinging a webhook endpoint.
 */
export function usePingWebhook(
  up: UpApi,
  options: UpMutationHookOptions<WebhookEventCallback, { id: string }> = {},
) {
  return useMutationWithScopeInvalidation(
    async (variables) => await up.webhooks.ping(variables.id),
    options,
  );
}

/**
 * Creates a mutation hook that invalidates all keys in a cache scope on success.
 */
function useMutationWithScopeInvalidation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UpMutationHookOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();
  const { scopeKey = DEFAULT_QUERY_SCOPE_KEY, ...mutationOverrides } = options;

  return useMutation<TData, UpApiHttpError, TVariables>({
    ...mutationOverrides,
    mutationFn,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: upQueryKeys.scope(scopeKey),
      });
      await mutationOverrides.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
