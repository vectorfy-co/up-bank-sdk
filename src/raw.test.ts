import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { UpClient } from './helper/client';
import { UpRawApi } from './raw';

function createRaw(fetchMock: typeof fetch) {
  const client = new UpClient({
    apiKey: 'up:test:token',
    fetch: fetchMock,
    baseUrl: 'https://api.up.com.au/api/v1/',
    enableQueryCache: true,
    queryClient: new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 30_000 },
      },
    }),
  });

  return new UpRawApi(client);
}

describe('UpRawApi', () => {
  it('validates mapped operation responses with generated schemas', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          meta: {
            id: '123',
            statusEmoji: '⚡️',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const response = await raw.get('/util/ping');

    expect(response.meta.statusEmoji).toBe('⚡️');
  });

  it('caches GET requests for identical raw operations', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          meta: {
            id: '123',
            statusEmoji: '⚡️',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);
    await raw.get('/util/ping');
    await raw.get('/util/ping');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when a mapped operation response fails schema parsing', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ invalid: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);

    await expect(raw.get('/util/ping')).rejects.toThrow();
  });

  it('interpolates path parameters for mutation routes', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);
    await raw.post('/transactions/{transactionId}/relationships/tags', {
      path: { transactionId: 'txn_1' },
      body: { data: [{ type: 'tags', id: 'groceries' }] },
    });

    const callUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(callUrl).toContain('/transactions/txn_1/relationships/tags');
  });

  it('throws for missing path parameter in runtime-unsafe invocation', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const unsafeRaw = raw as unknown as {
      post: (path: string, options: unknown) => Promise<unknown>;
    };

    await expect(
      unsafeRaw.post('/transactions/{transactionId}/relationships/tags', {
        body: { data: [{ type: 'tags', id: 'groceries' }] },
      }),
    ).rejects.toThrow('Missing required path parameter');
  });

  it('throws for invalid query value shape in runtime-unsafe invocation', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const unsafeRaw = raw as unknown as {
      get: (path: string, options: unknown) => Promise<unknown>;
    };

    await expect(
      unsafeRaw.get('/transactions', {
        query: { invalid: { nested: true } },
      }),
    ).rejects.toThrow('Unsupported query value');
  });

  it('throws when no operation schema mapping is available', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const raw = createRaw(fetchMock as unknown as typeof fetch);

    await expect(
      (raw as { get: (path: string) => Promise<unknown> }).get('/unknown'),
    ).rejects.toThrow('No operation schema mapping found');
  });

  it('supports typed PATCH operations', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const raw = createRaw(fetchMock as unknown as typeof fetch);

    await raw.patch('/transactions/{transactionId}/relationships/category', {
      path: { transactionId: 'txn_1' },
      body: { data: { type: 'categories', id: 'cat_1' } },
    });

    const callUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(callUrl).toContain('/transactions/txn_1/relationships/category');
  });

  it('supports typed DELETE operations', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const raw = createRaw(fetchMock as unknown as typeof fetch);

    await raw.delete('/webhooks/{id}', {
      path: { id: 'wh_1' },
      body: null,
    });

    const callUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(callUrl).toContain('/webhooks/wh_1');
  });

  it('throws for invalid path object shapes in runtime-unsafe invocation', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const unsafeRaw = raw as unknown as {
      delete: (path: string, options: unknown) => Promise<unknown>;
      patch: (path: string, options: unknown) => Promise<unknown>;
    };

    await expect(
      unsafeRaw.delete('/webhooks/{id}', {
        path: ['wh_1'],
      }),
    ).rejects.toThrow('Path parameters must be an object when provided');

    await expect(
      unsafeRaw.patch('/transactions/{transactionId}/relationships/category', {
        path: { transactionId: null },
        body: { data: { type: 'categories', id: 'cat_1' } },
      }),
    ).rejects.toThrow('cannot be null or undefined');
  });

  it('throws for invalid query object shapes and array values', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: [],
          links: { prev: null, next: null },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });
    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const unsafeRaw = raw as unknown as {
      get: (path: string, options: unknown) => Promise<unknown>;
      post: (path: string, options?: unknown) => Promise<unknown>;
    };

    await expect(
      unsafeRaw.get('/transactions', {
        query: 'not-an-object',
      }),
    ).rejects.toThrow('Query parameters must be an object when provided');

    await expect(
      unsafeRaw.get('/transactions', {
        query: { filterTag: ['groceries', { nested: true }] },
      }),
    ).rejects.toThrow('Unsupported query array value');

    await expect(unsafeRaw.post('/webhooks/{webhookId}/ping')).rejects.toThrow(
      'Missing required path parameter',
    );
  });

  it('applies default empty options for runtime-unsafe delete and patch calls', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('null', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const raw = createRaw(fetchMock as unknown as typeof fetch);
    const unsafeRaw = raw as unknown as {
      delete: (path: string, options?: unknown) => Promise<unknown>;
      patch: (path: string, options?: unknown) => Promise<unknown>;
    };

    await expect(unsafeRaw.delete('/webhooks/{id}')).rejects.toThrow(
      'Missing required path parameter',
    );
    await expect(
      unsafeRaw.patch('/transactions/{transactionId}/relationships/category'),
    ).rejects.toThrow('Missing required path parameter');
  });
});
