import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpApi } from './index';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function getAuthorizationHeader(init: RequestInit | undefined): string | null {
  return new Headers(init?.headers).get('Authorization');
}

describe('UpApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructs from api key string and initializes namespace clients', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        meta: { id: 'meta_1', statusEmoji: '⚡️' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const up = new UpApi('up:test:string');
    expect(up.util).toBeDefined();
    expect(up.accounts).toBeDefined();
    expect(up.categories).toBeDefined();
    expect(up.attachments).toBeDefined();
    expect(up.transactions).toBeDefined();
    expect(up.tags).toBeDefined();
    expect(up.webhooks).toBeDefined();
    expect(up.raw).toBeDefined();

    await up.util.ping({ cache: false });

    const init = (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as RequestInit | undefined;
    expect(getAuthorizationHeader(init)).toBe('Bearer up:test:string');
  });

  it('constructs from null and supports updateApiKey at runtime', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        meta: { id: 'meta_1', statusEmoji: '⚡️' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const up = new UpApi(null);
    up.updateApiKey('up:test:runtime');
    await up.util.ping({ cache: false });

    const init = (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as RequestInit | undefined;
    expect(getAuthorizationHeader(init)).toBe('Bearer up:test:runtime');
    expect(up.getQueryClient()).toBeDefined();
  });

  it('constructs from options object', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        meta: { id: 'meta_1', statusEmoji: '⚡️' },
      }),
    );

    const up = new UpApi({
      apiKey: 'up:test:object',
      baseUrl: 'https://api.up.com.au/api/v1/',
      fetch: fetchMock as unknown as typeof fetch,
    });

    await up.util.ping({ cache: false });

    const init = (fetchMock.mock.calls[0] as unknown[] | undefined)?.[1] as RequestInit | undefined;
    expect(getAuthorizationHeader(init)).toBe('Bearer up:test:object');
  });
});
