import { describe, expect, it } from 'vitest';
import { DEFAULT_QUERY_SCOPE_KEY, upQueryKeys } from './query-keys';

describe('upQueryKeys', () => {
  it('builds default-scope key hierarchies for all resources', () => {
    expect(upQueryKeys.scope()).toEqual(['up-sdk', DEFAULT_QUERY_SCOPE_KEY]);
    expect(upQueryKeys.accounts.all()).toEqual(['up-sdk', DEFAULT_QUERY_SCOPE_KEY, 'accounts']);
    expect(upQueryKeys.accounts.list({})).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'accounts',
      'list',
      {},
    ]);
    expect(upQueryKeys.accounts.detail('acc_1')).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'accounts',
      'detail',
      'acc_1',
    ]);

    expect(upQueryKeys.categories.list({ parent: 'cat_root' })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'categories',
      'list',
      { parent: 'cat_root' },
    ]);
    expect(upQueryKeys.categories.detail('cat_1')).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'categories',
      'detail',
      'cat_1',
    ]);

    expect(upQueryKeys.tags.list({ pageSize: 5 })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'tags',
      'list',
      { pageSize: 5 },
    ]);

    expect(upQueryKeys.transactions.list({ filterTag: 'groceries' })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'transactions',
      'list',
      { filterTag: 'groceries' },
    ]);
    expect(upQueryKeys.transactions.byAccount('acc_1', { pageSize: 25 })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'transactions',
      'by-account',
      'acc_1',
      { pageSize: 25 },
    ]);
    expect(upQueryKeys.transactions.detail('txn_1')).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'transactions',
      'detail',
      'txn_1',
    ]);

    expect(upQueryKeys.util.ping()).toEqual(['up-sdk', DEFAULT_QUERY_SCOPE_KEY, 'util', 'ping']);

    expect(upQueryKeys.webhooks.list({ pageSize: 5 })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'webhooks',
      'list',
      { pageSize: 5 },
    ]);
    expect(upQueryKeys.webhooks.detail('wh_1')).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'webhooks',
      'detail',
      'wh_1',
    ]);
    expect(upQueryKeys.webhooks.logs('wh_1', { pageSize: 10 })).toEqual([
      'up-sdk',
      DEFAULT_QUERY_SCOPE_KEY,
      'webhooks',
      'logs',
      'wh_1',
      { pageSize: 10 },
    ]);
  });

  it('builds scoped keys when a custom scope is provided', () => {
    const scope = 'tenant-a';
    expect(upQueryKeys.scope(scope)).toEqual(['up-sdk', scope]);
    expect(upQueryKeys.accounts.all(scope)).toEqual(['up-sdk', scope, 'accounts']);
    expect(upQueryKeys.categories.all(scope)).toEqual(['up-sdk', scope, 'categories']);
    expect(upQueryKeys.tags.all(scope)).toEqual(['up-sdk', scope, 'tags']);
    expect(upQueryKeys.transactions.all(scope)).toEqual(['up-sdk', scope, 'transactions']);
    expect(upQueryKeys.util.all(scope)).toEqual(['up-sdk', scope, 'util']);
    expect(upQueryKeys.webhooks.all(scope)).toEqual(['up-sdk', scope, 'webhooks']);
  });
});
