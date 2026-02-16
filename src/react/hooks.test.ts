// @vitest-environment jsdom

import type { PropsWithChildren } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UpApi } from '../index';
import {
  useAccount,
  useAccountTransactions,
  useAccountsList,
  useAddTransactionTags,
  useCategoriesList,
  useCategory,
  useCreateWebhook,
  useDeleteWebhook,
  usePing,
  usePingWebhook,
  useRemoveTransactionTags,
  useTagsList,
  useTransaction,
  useUpdateTransactionCategory,
  useWebhook,
  useWebhookLogs,
  useWebhooksList,
  useTransactionsList,
} from './hooks';
import { upQueryKeys } from './query-keys';

function createWrapper(): {
  queryClient: QueryClient;
  wrapper: React.ComponentType<PropsWithChildren>;
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: PropsWithChildren) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

describe('react query hooks', () => {
  it('creates stable query keys for scoped requests', () => {
    expect(upQueryKeys.transactions.list({ pageSize: 10 }, 'tenant-a')).toEqual([
      'up-sdk',
      'tenant-a',
      'transactions',
      'list',
      { pageSize: 10 },
    ]);
  });

  it('returns successful query results for usePing', async () => {
    const ping = vi.fn(async () => ({ meta: { id: '1', statusEmoji: '⚡️' } }));
    const up = {
      util: { ping },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePing(up), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ping).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledWith({ cache: false });
    expect(result.current.data?.meta.statusEmoji).toBe('⚡️');
  });

  it('passes query params through useTransactionsList', async () => {
    const list = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const up = {
      transactions: { list },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();
    renderHook(() => useTransactionsList(up, { pageSize: 5, filterTag: 'groceries' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({ pageSize: 5, filterTag: 'groceries' }, { cache: false });
    });

    expect(list).toHaveBeenCalledWith({ pageSize: 5, filterTag: 'groceries' }, { cache: false });
  });

  it('passes cache overrides through useAccountsList', async () => {
    const list = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const up = {
      accounts: { list },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();
    renderHook(() => useAccountsList(up, { pageSize: 3 }, { scopeKey: 'tenant-c' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({ pageSize: 3 }, { cache: false });
    });
  });

  it('passes account-scoped params through useAccountTransactions', async () => {
    const listByAccount = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const up = {
      transactions: { listByAccount },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();
    renderHook(() => useAccountTransactions(up, 'acc_1', { pageSize: 2 }), { wrapper });

    await waitFor(() => {
      expect(listByAccount).toHaveBeenCalledWith('acc_1', { pageSize: 2 }, { cache: false });
    });
  });

  it('passes webhook log params through useWebhookLogs', async () => {
    const listLogs = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const up = {
      webhooks: { listLogs },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();
    renderHook(() => useWebhookLogs(up, 'wh_1', { pageSize: 8 }), { wrapper });

    await waitFor(() => {
      expect(listLogs).toHaveBeenCalledWith('wh_1', { pageSize: 8 }, { cache: false });
    });
  });

  it('executes remaining read hooks with default params/options', async () => {
    const retrieveAccount = vi.fn(async () => ({ data: { id: 'acc_1' } }));
    const listCategories = vi.fn(async () => ({ data: [] }));
    const retrieveCategory = vi.fn(async () => ({ data: { id: 'cat_1' } }));
    const retrieveTransaction = vi.fn(async () => ({ data: { id: 'txn_1' } }));
    const listTags = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const listWebhooks = vi.fn(async () => ({ data: [], links: { prev: null, next: null } }));
    const retrieveWebhook = vi.fn(async () => ({ data: { id: 'wh_1' } }));
    const up = {
      accounts: { retrieve: retrieveAccount },
      categories: { list: listCategories, retrieve: retrieveCategory },
      transactions: { retrieve: retrieveTransaction },
      tags: { list: listTags },
      webhooks: { list: listWebhooks, retrieve: retrieveWebhook },
    } as unknown as UpApi;

    const { wrapper } = createWrapper();

    renderHook(() => useAccount(up, 'acc_1'), { wrapper });
    renderHook(() => useCategoriesList(up), { wrapper });
    renderHook(() => useCategory(up, 'cat_1'), { wrapper });
    renderHook(() => useTransaction(up, 'txn_1'), { wrapper });
    renderHook(() => useTagsList(up), { wrapper });
    renderHook(() => useWebhooksList(up), { wrapper });
    renderHook(() => useWebhook(up, 'wh_1'), { wrapper });

    await waitFor(() => {
      expect(retrieveAccount).toHaveBeenCalledWith('acc_1', { cache: false });
      expect(listCategories).toHaveBeenCalledWith({}, { cache: false });
      expect(retrieveCategory).toHaveBeenCalledWith('cat_1', { cache: false });
      expect(retrieveTransaction).toHaveBeenCalledWith('txn_1', { cache: false });
      expect(listTags).toHaveBeenCalledWith({}, { cache: false });
      expect(listWebhooks).toHaveBeenCalledWith({}, { cache: false });
      expect(retrieveWebhook).toHaveBeenCalledWith('wh_1', { cache: false });
    });
  });

  it('applies query override options in read hooks', async () => {
    const retrieve = vi.fn(async () => ({ data: { id: 'cat_1' } }));
    const up = {
      categories: { retrieve },
    } as unknown as UpApi;
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useCategory(up, 'cat_1', {
          scopeKey: 'tenant-overrides',
          enabled: true,
          staleTime: 10_000,
          gcTime: 20_000,
          retry: 1,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchOnMount: false,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(retrieve).toHaveBeenCalledWith('cat_1', { cache: false });
    });
  });

  it('invalidates scoped cache after mutation success', async () => {
    const create = vi.fn(async () => ({
      data: {
        id: 'w1',
        type: 'webhooks',
        attributes: {
          url: 'https://example.com',
          description: null,
          createdAt: '2026-01-01T00:00:00+00:00',
        },
        relationships: { logs: {} },
      },
    }));
    const up = {
      webhooks: { create },
    } as unknown as UpApi;

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateWebhook(up, { scopeKey: 'tenant-b' }), {
      wrapper,
    });

    await result.current.mutateAsync({ url: 'https://example.com' });

    expect(invalidateSpy).toHaveBeenCalled();
    expect(invalidateSpy.mock.calls[0]?.[0]).toEqual({ queryKey: ['up-sdk', 'tenant-b'] });
  });

  it('runs mutation success callback after invalidation', async () => {
    const updateTransactionCategory = vi.fn(async () => undefined);
    const onSuccess = vi.fn(async () => undefined);
    const up = {
      categories: { updateTransactionCategory },
    } as unknown as UpApi;

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useUpdateTransactionCategory(up, { onSuccess, scopeKey: 'tenant-z' }),
      { wrapper },
    );

    await result.current.mutateAsync({
      transactionId: 'txn_1',
      category: { type: 'categories', id: 'cat_1' },
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['up-sdk', 'tenant-z'] });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('runs tag mutation hooks and invalidates default scope', async () => {
    const addTagsToTransaction = vi.fn(async () => undefined);
    const removeTagsFromTransaction = vi.fn(async () => undefined);
    const up = {
      tags: { addTagsToTransaction, removeTagsFromTransaction },
    } as unknown as UpApi;
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const add = renderHook(() => useAddTransactionTags(up), { wrapper });
    const remove = renderHook(() => useRemoveTransactionTags(up), { wrapper });

    await add.result.current.mutateAsync({
      transactionId: 'txn_1',
      tags: [{ type: 'tags', id: 'groceries' }],
    });
    await remove.result.current.mutateAsync({
      transactionId: 'txn_1',
      tags: [{ type: 'tags', id: 'groceries' }],
    });

    expect(addTagsToTransaction).toHaveBeenCalledWith('txn_1', [{ type: 'tags', id: 'groceries' }]);
    expect(removeTagsFromTransaction).toHaveBeenCalledWith('txn_1', [
      { type: 'tags', id: 'groceries' },
    ]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['up-sdk', 'default'] });
  });

  it('runs webhook mutation hooks', async () => {
    const deleteWebhook = vi.fn(async () => undefined);
    const pingWebhook = vi.fn(async () => ({
      data: {
        id: 'evt_1',
        type: 'webhook-events',
        attributes: { eventType: 'PING', createdAt: '2026-01-01T00:00:00+00:00' },
        relationships: { webhook: { data: { id: 'wh_1', type: 'webhooks' } } },
      },
    }));
    const up = {
      webhooks: { delete: deleteWebhook, ping: pingWebhook },
    } as unknown as UpApi;
    const { wrapper } = createWrapper();

    const remove = renderHook(() => useDeleteWebhook(up), { wrapper });
    const ping = renderHook(() => usePingWebhook(up), { wrapper });

    await remove.result.current.mutateAsync({ id: 'wh_1' });
    await ping.result.current.mutateAsync({ id: 'wh_1' });

    expect(deleteWebhook).toHaveBeenCalledWith('wh_1');
    expect(pingWebhook).toHaveBeenCalledWith('wh_1');
  });
});
