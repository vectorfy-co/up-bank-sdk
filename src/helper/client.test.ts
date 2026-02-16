import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { z } from 'zod';
import { isUpApiHttpError } from '../errors';
import { isUpApiError } from '../utilities';
import { EmptyResponseSchema, UpClient } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function getAuthorizationHeader(init: RequestInit | undefined): string | null {
  return new Headers(init?.headers).get('Authorization');
}

describe('UpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses fetch() with Authorization header', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return jsonResponse({ meta: { id: 'x', statusEmoji: '⚡️' } });
    });

    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      queryClient: new QueryClient(),
      enableQueryCache: false,
    });

    const data = await client.get<{ meta: { id: string; statusEmoji: string } }>('util/ping', {
      responseSchema: z.object({
        meta: z.object({ id: z.string(), statusEmoji: z.string() }),
      }),
    });
    expect(data.meta.statusEmoji).toBe('⚡️');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    const init = firstCall?.[1] as RequestInit | undefined;
    expect(getAuthorizationHeader(init)).toBe('Bearer up:test:token');
  });

  it('caches GET calls when enableQueryCache=true', async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse({ ok: true });
    });

    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: true,
    });

    const responseSchema = z.object({ ok: z.boolean() });
    await client.get('accounts?page[size]=1', { responseSchema });
    await client.get('accounts?page[size]=1', { responseSchema });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('calls tokenProvider for each request when no static apiKey is configured', async () => {
    const tokenProvider = vi.fn(async () => 'up:test:token');
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));

    const client = new UpClient({
      tokenProvider,
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const responseSchema = z.object({ ok: z.boolean() });
    await client.get('accounts', { responseSchema });
    await client.get('accounts', { responseSchema });

    expect(tokenProvider).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once on 401 and calls onAuthError before re-fetching token', async () => {
    const tokenProvider = vi
      .fn(async () => 'up:test:fallback')
      .mockResolvedValueOnce('up:test:stale')
      .mockResolvedValueOnce('up:test:fresh');
    const onAuthError = vi.fn(async () => undefined);

    const fetchMock = vi
      .fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
        void _input;
        void _init;
        return jsonResponse({ errors: [{ title: 'unauthorized' }] }, 401);
      })
      .mockResolvedValueOnce(jsonResponse({ errors: [{ title: 'unauthorized' }] }, 401))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }, 200));

    const client = new UpClient({
      tokenProvider,
      onAuthError,
      retryOn401: true,
      maxAuthRetries: 1,
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const data = await client.get<{ data: { ok: boolean } }>('util/ping', {
      responseSchema: z.object({ data: z.object({ ok: z.boolean() }) }),
    });

    expect(data.data.ok).toBe(true);
    expect(onAuthError).toHaveBeenCalledTimes(1);
    expect(tokenProvider).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstAuthHeader = getAuthorizationHeader(
      (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as RequestInit | undefined,
    );
    const secondAuthHeader = getAuthorizationHeader(
      (fetchMock.mock.calls[1] as unknown[] | undefined)?.[1] as RequestInit | undefined,
    );
    expect(firstAuthHeader).toBe('Bearer up:test:stale');
    expect(secondAuthHeader).toBe('Bearer up:test:fresh');
  });

  it('clears cached GET queries when token identity changes', async () => {
    let activeToken = 'up:test:user-a';
    let responseCount = 0;
    const fetchMock = vi.fn(async () => {
      responseCount += 1;
      return jsonResponse({ responseCount });
    });

    const client = new UpClient({
      tokenProvider: async () => activeToken,
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: true,
    });

    const responseSchema = z.object({ responseCount: z.number() });
    const first = await client.get<{ responseCount: number }>('accounts?page[size]=1', {
      responseSchema,
    });
    const second = await client.get<{ responseCount: number }>('accounts?page[size]=1', {
      responseSchema,
    });
    activeToken = 'up:test:user-b';
    const third = await client.get<{ responseCount: number }>('accounts?page[size]=1', {
      responseSchema,
    });

    expect(first.responseCount).toBe(1);
    expect(second.responseCount).toBe(1);
    expect(third.responseCount).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('invalidates cached GET queries after a successful mutation', async () => {
    let getCount = 0;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET') {
        getCount += 1;
        return jsonResponse({ getCount });
      }
      return jsonResponse(null);
    });

    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: true,
    });

    const responseSchema = z.object({ getCount: z.number() });
    const beforeMutation = await client.get<{ getCount: number }>('accounts', {
      responseSchema,
    });
    await client.get<{ getCount: number }>('accounts', { responseSchema });
    await client.post('webhooks', {
      payload: { attributes: { url: 'https://example.test/hook' } },
      responseSchema: EmptyResponseSchema,
    });
    const afterMutation = await client.get<{ getCount: number }>('accounts', {
      responseSchema,
    });

    expect(beforeMutation.getCount).toBe(1);
    expect(afterMutation.getCount).toBe(2);
    expect(getCount).toBe(2);
  });

  it('throws when response does not match the configured response schema', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ notExpected: true }));
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await expect(
      client.get('util/ping', {
        responseSchema: z.object({
          meta: z.object({ id: z.string(), statusEmoji: z.string() }),
        }),
      }),
    ).rejects.toThrow();
  });

  it('parses API errors with ErrorResponseSchema before throwing', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          errors: [
            {
              status: '401',
              title: 'Unauthorized',
              detail: 'No token',
            },
          ],
        },
        401,
      ),
    );
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    try {
      await client.get('util/ping', {
        responseSchema: z.object({
          meta: z.object({ id: z.string(), statusEmoji: z.string() }),
        }),
      });
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(isUpApiHttpError(error)).toBe(true);
      expect(isUpApiError(error)).toBe(true);
    }
  });

  it('throws a clear error when no access token is configured', async () => {
    const client = new UpClient({
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: vi.fn(async () => jsonResponse({ ok: true })) as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await expect(
      client.get('util/ping', {
        responseSchema: z.object({ ok: z.boolean() }),
      }),
    ).rejects.toThrow('No access token available');
  });

  it('falls back to raw response body when error is not valid JSON', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('server exploded', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    });

    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    try {
      await client.get('util/ping', {
        responseSchema: z.object({
          meta: z.object({ id: z.string(), statusEmoji: z.string() }),
        }),
      });
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(isUpApiHttpError(error)).toBe(true);
      if (isUpApiHttpError(error)) {
        expect(error.data).toBe('server exploded');
      }
    }
  });

  it('serializes array query params and skips null values', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await client.get('transactions', {
      responseSchema: z.object({ ok: z.boolean() }),
      query: {
        'filter[tag]': ['groceries', null, 'fuel'],
        'filter[category]': undefined,
      },
    });

    const requestUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(requestUrl).toContain('filter%5Btag%5D=groceries');
    expect(requestUrl).toContain('filter%5Btag%5D=fuel');
    expect(requestUrl).not.toContain('filter%5Bcategory%5D');
  });

  it('transforms pagination links into callable functions by default', async () => {
    const fetchMock = vi
      .fn(async () =>
        jsonResponse({
          data: [{ id: '1' }],
          links: { prev: null, next: '/accounts?page[size]=1&page[after]=abc' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '1' }],
          links: { prev: null, next: '/accounts?page[size]=1&page[after]=abc' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '2' }],
          links: { prev: '/accounts?page[size]=1&page[before]=abc', next: null },
        }),
      );

    const responseSchema = z.object({
      data: z.array(z.object({ id: z.string() })),
      links: z.object({
        prev: z.string().nullable(),
        next: z.string().nullable(),
      }),
    });
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const page = await client.get('accounts', { responseSchema });
    expect(typeof page.links.next).toBe('function');

    const nextPage = await page.links.next?.();
    expect(nextPage?.data[0]?.id).toBe('2');
  });

  it('preserves raw pagination links when processing is disabled', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: [{ id: '1' }],
        links: { prev: null, next: '/accounts?page[size]=1&page[after]=abc' },
      }),
    );

    const responseSchema = z.object({
      data: z.array(z.object({ id: z.string() })),
      links: z.object({
        prev: z.string().nullable(),
        next: z.string().nullable(),
      }),
    });
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const page = await client.get('accounts', {
      responseSchema,
      processPaginationLinks: false,
    });
    expect(page.links.next).toBe('/accounts?page[size]=1&page[after]=abc');
  });

  it('uses constructor defaults for baseUrl, fetch, and query cache', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new UpClient({
      apiKey: 'up:test:token',
    });

    await client.get('util/ping', {
      responseSchema: z.object({ ok: z.boolean() }),
    });
    await client.get('util/ping', {
      responseSchema: z.object({ ok: z.boolean() }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(requestUrl).toBe('https://api.up.com.au/api/v1/util/ping');
  });

  it('throws when request path normalizes to empty', async () => {
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: vi.fn(async () => jsonResponse({ ok: true })) as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await expect(
      client.get('/', {
        responseSchema: z.object({ ok: z.boolean() }),
      }),
    ).rejects.toThrow('path must not be empty');
  });

  it('attaches x-request-id from error responses', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          errors: [{ status: '500', title: 'Server Error', detail: 'Oops' }],
        }),
        {
          status: 500,
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req_123',
          },
        },
      );
    });
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    try {
      await client.get('util/ping', {
        responseSchema: z.object({
          meta: z.object({ id: z.string(), statusEmoji: z.string() }),
        }),
      });
      throw new Error('Expected request to fail');
    } catch (error) {
      expect(isUpApiHttpError(error)).toBe(true);
      if (isUpApiHttpError(error)) {
        expect(error.requestId).toBe('req_123');
      }
    }
  });

  it('parses empty successful responses as null for schema validation', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('', {
        status: 200,
      });
    });
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const response = await client.post('webhooks/wh_1/ping', {
      responseSchema: z.null(),
    });
    expect(response).toBeNull();
  });

  it('supports primitive query values in serialization', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await client.get('transactions', {
      responseSchema: z.object({ ok: z.boolean() }),
      query: {
        'filter[status]': 'HELD',
        'page[size]': 10,
        include: true,
      },
    });

    const requestUrl = String((fetchMock.mock.calls[0] as unknown[] | undefined)?.[0]);
    expect(requestUrl).toContain('filter%5Bstatus%5D=HELD');
    expect(requestUrl).toContain('page%5Bsize%5D=10');
    expect(requestUrl).toContain('include=true');
  });

  it('maps pagination links with base-path prefixes and root-path base URLs', async () => {
    const responseSchema = z.object({
      data: z.array(z.object({ id: z.string() })),
      links: z.object({
        prev: z.string().nullable(),
        next: z.string().nullable(),
      }),
    });

    const prefixedFetch = vi
      .fn(async () =>
        jsonResponse({
          data: [{ id: '1' }],
          links: {
            prev: null,
            next: '/api/v1/accounts?page[size]=1&page[after]=abc',
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '1' }],
          links: {
            prev: null,
            next: '/api/v1/accounts?page[size]=1&page[after]=abc',
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '2' }],
          links: { prev: null, next: null },
        }),
      );

    const prefixedClient = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: prefixedFetch as unknown as typeof fetch,
      enableQueryCache: false,
    });

    const first = await prefixedClient.get('accounts', { responseSchema });
    const second = await first.links.next?.();
    expect(second?.data[0]?.id).toBe('2');
    const secondUrl = String((prefixedFetch.mock.calls[1] as unknown[] | undefined)?.[0]);
    expect(secondUrl).toContain('/api/v1/accounts?page[size]=1&page[after]=abc');

    const rootFetch = vi
      .fn(async () =>
        jsonResponse({
          data: [{ id: '1' }],
          links: { prev: null, next: '/accounts?page[size]=1&page[after]=xyz' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '1' }],
          links: { prev: null, next: '/accounts?page[size]=1&page[after]=xyz' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: '2' }],
          links: { prev: null, next: null },
        }),
      );

    const rootClient = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/',
      fetch: rootFetch as unknown as typeof fetch,
      enableQueryCache: false,
    });
    const rootPage = await rootClient.get('accounts', { responseSchema });
    const rootNext = await rootPage.links.next?.();
    expect(rootNext?.data[0]?.id).toBe('2');
  });

  it('throws when pagination link cannot be mapped to a request path', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: [{ id: '1' }],
        links: { prev: null, next: '/' },
      }),
    );
    const client = new UpClient({
      apiKey: 'up:test:token',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });
    const responseSchema = z.object({
      data: z.array(z.object({ id: z.string() })),
      links: z.object({
        prev: z.string().nullable(),
        next: z.string().nullable(),
      }),
    });

    const first = await client.get('accounts', { responseSchema });
    await expect(first.links.next?.()).rejects.toThrow('Could not map pagination link to path');
  });

  it('sends mutation requests without payload wrappers when no payload is provided', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });

    await client.patch('transactions/tx_1/relationships/category', {
      responseSchema: z.object({ ok: z.boolean() }),
    });
    await client.delete('webhooks/wh_1', {
      responseSchema: z.object({ ok: z.boolean() }),
    });

    const firstInit = (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;
    const secondInit = (fetchMock.mock.calls[1] as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;
    expect(firstInit?.body).toBeUndefined();
    expect(secondInit?.body).toBeUndefined();
  });

  it('clearApiKey resets auth identity and token source', async () => {
    const tokenProvider = vi.fn(async () => 'up:test:provider');
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new UpClient({
      apiKey: 'up:test:initial',
      tokenProvider,
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: true,
    });
    const queryClient = client.getQueryClient();
    const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');

    await client.get('util/ping', {
      responseSchema: z.object({ ok: z.boolean() }),
    });
    client.clearApiKey();
    await client.get('util/ping', {
      responseSchema: z.object({ ok: z.boolean() }),
    });

    expect(tokenProvider).toHaveBeenCalledTimes(1);
    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['up', 'GET'] });
    const firstAuthHeader = getAuthorizationHeader(
      (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as RequestInit | undefined,
    );
    const secondAuthHeader = getAuthorizationHeader(
      (fetchMock.mock.calls[1] as unknown[] | undefined)?.[1] as RequestInit | undefined,
    );
    expect(firstAuthHeader).toBe('Bearer up:test:initial');
    expect(secondAuthHeader).toBe('Bearer up:test:provider');
  });

  it('supports custom error schemas and wrapped payloads for all mutation methods', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new UpClient({
      apiKey: 'up:test:token',
      fetch: fetchMock as unknown as typeof fetch,
      enableQueryCache: false,
    });
    const errorSchema = z.object({
      errors: z.array(
        z.object({
          status: z.string(),
          title: z.string(),
          detail: z.string().optional(),
        }),
      ),
    });
    const responseSchema = z.object({ ok: z.boolean() });

    await client.post('webhooks', {
      payload: { attributes: { url: 'https://example.com/hook' } },
      responseSchema,
      errorSchema,
    });
    await client.patch('transactions/tx_1/relationships/category', {
      payload: { data: { type: 'categories', id: 'cat_1' } },
      responseSchema,
      errorSchema,
    });
    await client.delete('transactions/tx_1/relationships/tags', {
      payload: { data: [{ type: 'tags', id: 'groceries' }] },
      responseSchema,
      errorSchema,
    });

    const postInit = (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;
    const patchInit = (fetchMock.mock.calls[1] as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;
    const deleteInit = (fetchMock.mock.calls[2] as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;

    expect(postInit?.body).toContain('"data"');
    expect(patchInit?.body).toContain('"data"');
    expect(deleteInit?.body).toContain('"data"');
  });
});
