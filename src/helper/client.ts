import { QueryClient } from '@tanstack/query-core';
import { z } from 'zod';
import { BASE_URL } from '../constants';
import { UpApiHttpError } from '../errors';
import { ErrorResponseSchema } from '../gen/schemas';

/**
 * Fetch implementation signature used by the SDK client.
 */
export type UpClientFetch = typeof fetch;

/**
 * Primitive query value supported by URL encoding logic.
 */
export type QueryParamPrimitive = string | number | boolean | null | undefined;
/**
 * Query value that can be a primitive or repeated primitive collection.
 */
export type QueryParamValue = QueryParamPrimitive | readonly QueryParamPrimitive[];
/**
 * Query map keyed by parameter name.
 */
export type QueryParams = Readonly<Record<string, QueryParamValue>>;

/**
 * Callback used to resolve an access token at request time.
 */
export type AccessTokenProvider = () => string | Promise<string>;

/**
 * Context passed to auth-error hooks after a 401 response.
 */
export type AuthErrorContext = {
  readonly attempt: number;
  readonly maxRetries: number;
  readonly status: number;
  readonly method: HttpMethod;
  readonly url: string;
};

/**
 * Configuration for {@link UpClient}.
 */
export type UpClientOptions = {
  apiKey?: string | null;
  tokenProvider?: AccessTokenProvider;
  onAuthError?: (context: AuthErrorContext) => void | Promise<void>;
  retryOn401?: boolean;
  maxAuthRetries?: number;
  baseUrl?: string;
  fetch?: UpClientFetch;
  queryClient?: QueryClient;
  enableQueryCache?: boolean;
};

/**
 * Supported HTTP methods for the Up API.
 */
export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

/**
 * Runtime response schema used for payload validation.
 */
export type UpResponseSchema<TResponse = unknown> = z.ZodType<TResponse>;

type PaginationLink<TResponse> = null | (() => Promise<TResponse>);
type WithRuntimePaginationLinks<TResponse> = TResponse extends { links: infer TLinks }
  ? TLinks extends { next?: string | null; prev?: string | null }
    ? Omit<TResponse, 'links'> & {
        links: Omit<TLinks, 'next' | 'prev'> & {
          next: PaginationLink<TResponse>;
          prev: PaginationLink<TResponse>;
        };
      }
    : TResponse
  : TResponse;

/**
 * Schema used by endpoints that return no content body.
 */
export const EmptyResponseSchema = z.null().transform(() => undefined);

/**
 * Normalized low-level request options consumed by {@link UpClient.request}.
 */
export type UpRequestOptions = {
  method: HttpMethod;
  path: string;
  responseSchema: UpResponseSchema;
  errorSchema?: z.ZodTypeAny | undefined;
  query?: QueryParams | undefined;
  payload?: unknown | undefined;
  cache?: boolean | undefined;
  processPaginationLinks?: boolean | undefined;
  cacheKeyParts?: readonly unknown[] | undefined;
};

/**
 * Internal HTTP client with auth, retries, runtime validation, and cache integration.
 */
export class UpClient {
  private explicitApiKey: string | null = null;
  private readonly tokenProvider: AccessTokenProvider | undefined;
  private readonly onAuthError: ((context: AuthErrorContext) => void | Promise<void>) | undefined;
  private readonly retryOn401: boolean;
  private readonly maxAuthRetries: number;

  private readonly baseUrl: string;
  private readonly fetchImpl: UpClientFetch;
  private readonly queryClient: QueryClient;
  private readonly enableQueryCache: boolean;
  private authIdentity = 'anonymous';

  /**
   * Creates a new low-level client instance.
   *
   * @param options Client configuration.
   */
  constructor(options: UpClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.fetchImpl = options.fetch ?? fetch;
    this.tokenProvider = options.tokenProvider;
    this.onAuthError = options.onAuthError;
    this.retryOn401 = options.retryOn401 ?? true;
    this.maxAuthRetries = options.maxAuthRetries ?? 1;
    this.queryClient =
      options.queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 2,
          },
        },
      });
    this.enableQueryCache = options.enableQueryCache ?? true;

    if (options.apiKey != null) {
      this.updateApiKey(options.apiKey);
    }
  }

  /**
   * Updates the static API key used for authentication.
   *
   * @param apiKey New bearer token.
   */
  public updateApiKey(apiKey: string): void {
    this.explicitApiKey = apiKey;
    this.syncAuthIdentity(apiKey);
  }

  /**
   * Clears the static API key and falls back to token-provider auth.
   */
  public clearApiKey(): void {
    this.explicitApiKey = null;
    this.syncAuthIdentity(null);
  }

  /**
   * Returns the internal query client used for request caching.
   *
   * @returns TanStack Query client instance.
   */
  public getQueryClient(): QueryClient {
    return this.queryClient;
  }

  /**
   * Executes a low-level request with runtime schema validation.
   *
   * @param options Normalized request options.
   * @returns Parsed and validated response payload.
   */
  public async request<TResponse>(options: UpRequestOptions): Promise<TResponse> {
    const normalizedPath = normalizePath(options.path);
    const cache = options.cache ?? (options.method === 'GET' && this.enableQueryCache);
    const processPaginationLinks = options.processPaginationLinks ?? options.method === 'GET';

    const accessToken = await this.resolveAccessToken();
    this.syncAuthIdentity(accessToken);

    const queryString = serializeQueryParams(options.query);
    const requestPath = queryString ? `${normalizedPath}?${queryString}` : normalizedPath;

    const execute = async () =>
      await this.executeRequestWithAuthRetry<TResponse>({
        method: options.method,
        requestPath,
        payload: options.payload,
        processPaginationLinks,
        initialAccessToken: accessToken,
        responseSchema: options.responseSchema,
        errorSchema: options.errorSchema ?? ErrorResponseSchema,
      });

    if (cache && options.method === 'GET') {
      return await this.queryClient.fetchQuery({
        queryKey: ['up', 'GET', this.authIdentity, requestPath, ...(options.cacheKeyParts ?? [])],
        queryFn: execute,
      });
    }

    return await execute();
  }

  /**
   * Executes a GET request.
   *
   * @param path Relative API path.
   * @param options Request options including response schema and query params.
   * @returns Parsed response payload.
   */
  public async get<TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      errorSchema?: z.ZodTypeAny | undefined;
      query?: QueryParams | undefined;
      cache?: boolean | undefined;
      processPaginationLinks: false;
      cacheKeyParts?: readonly unknown[] | undefined;
    },
  ): Promise<TResponse>;

  public async get<TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      errorSchema?: z.ZodTypeAny | undefined;
      query?: QueryParams | undefined;
      cache?: boolean | undefined;
      processPaginationLinks?: true | undefined;
      cacheKeyParts?: readonly unknown[] | undefined;
    },
  ): Promise<WithRuntimePaginationLinks<TResponse>>;

  public async get<TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      errorSchema?: z.ZodTypeAny | undefined;
      query?: QueryParams | undefined;
      cache?: boolean | undefined;
      processPaginationLinks?: boolean | undefined;
      cacheKeyParts?: readonly unknown[] | undefined;
    },
  ): Promise<TResponse | WithRuntimePaginationLinks<TResponse>> {
    const requestOptions: UpRequestOptions = {
      method: 'GET',
      path,
      responseSchema: options.responseSchema,
    };

    if (options.errorSchema !== undefined) requestOptions.errorSchema = options.errorSchema;
    if (options.query !== undefined) requestOptions.query = options.query;
    if (options.cache !== undefined) requestOptions.cache = options.cache;
    if (options.processPaginationLinks !== undefined) {
      requestOptions.processPaginationLinks = options.processPaginationLinks;
    }
    if (options.cacheKeyParts !== undefined) {
      requestOptions.cacheKeyParts = options.cacheKeyParts;
    }

    const response = await this.request<TResponse>(requestOptions);
    if (options.processPaginationLinks === false) {
      return response;
    }

    return response as WithRuntimePaginationLinks<TResponse>;
  }

  /**
   * Executes a POST request.
   *
   * @param path Relative API path.
   * @param options Request options including response schema and payload.
   * @returns Parsed response payload.
   */
  public async post<TPayload, TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      payload?: TPayload | undefined;
      errorSchema?: z.ZodTypeAny | undefined;
    },
  ): Promise<TResponse> {
    return await this.request<TResponse>({
      method: 'POST',
      path,
      responseSchema: options.responseSchema,
      payload: options.payload === undefined ? undefined : { data: options.payload },
      ...(options.errorSchema ? { errorSchema: options.errorSchema } : {}),
    });
  }

  /**
   * Executes a DELETE request.
   *
   * @param path Relative API path.
   * @param options Request options including response schema and optional payload.
   * @returns Parsed response payload.
   */
  public async delete<TPayload, TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      payload?: TPayload | undefined;
      errorSchema?: z.ZodTypeAny | undefined;
    },
  ): Promise<TResponse> {
    return await this.request<TResponse>({
      method: 'DELETE',
      path,
      responseSchema: options.responseSchema,
      payload: options.payload === undefined ? undefined : { data: options.payload },
      ...(options.errorSchema ? { errorSchema: options.errorSchema } : {}),
    });
  }

  /**
   * Executes a PATCH request.
   *
   * @param path Relative API path.
   * @param options Request options including response schema and payload.
   * @returns Parsed response payload.
   */
  public async patch<TPayload, TResponse>(
    path: string,
    options: {
      responseSchema: UpResponseSchema<TResponse>;
      payload?: TPayload | undefined;
      errorSchema?: z.ZodTypeAny | undefined;
    },
  ): Promise<TResponse> {
    return await this.request<TResponse>({
      method: 'PATCH',
      path,
      responseSchema: options.responseSchema,
      payload: options.payload === undefined ? undefined : { data: options.payload },
      ...(options.errorSchema ? { errorSchema: options.errorSchema } : {}),
    });
  }

  /**
   * Converts a pagination link into a callable continuation function.
   *
   * @param link Pagination URL from API response.
   * @param responseSchema Schema used to validate subsequent pages.
   * @returns Null when no link exists, otherwise a function that fetches the next page.
   */
  public processLink<T>(
    link: string | null,
    responseSchema: UpResponseSchema<T>,
  ): null | (() => Promise<T>) {
    if (!link) return null;

    const linkHandler = async (): Promise<T> => {
      const destinationUrl = new URL(link, this.baseUrl);
      const relativePath = toPathRelativeToBase(destinationUrl, this.baseUrl);
      return await this.get<T>(relativePath, {
        responseSchema,
        processPaginationLinks: true,
      });
    };

    return linkHandler;
  }

  /**
   * Executes an HTTP call and optionally retries once auth is refreshed after 401.
   */
  private async executeRequestWithAuthRetry<TResponse>(options: {
    method: HttpMethod;
    requestPath: string;
    payload?: unknown;
    processPaginationLinks: boolean;
    initialAccessToken: string;
    responseSchema: UpResponseSchema;
    errorSchema: z.ZodTypeAny;
  }): Promise<TResponse> {
    let token = options.initialAccessToken;

    for (let attempt = 0; attempt <= this.maxAuthRetries; attempt++) {
      const response = await this.executeHttpRequest({
        method: options.method,
        requestPath: options.requestPath,
        payload: options.payload,
        accessToken: token,
      });

      if (response.status === 401 && this.retryOn401 && attempt < this.maxAuthRetries) {
        if (this.onAuthError) {
          await this.onAuthError({
            attempt,
            maxRetries: this.maxAuthRetries,
            status: response.status,
            method: options.method,
            url: response.url,
          });
        }
        token = await this.resolveAccessToken();
        this.syncAuthIdentity(token);
        continue;
      }

      const responseBody = response.text.length > 0 ? safeJsonParse(response.text) : null;

      if (!response.ok) {
        const parsedError = options.errorSchema.safeParse(responseBody);
        const requestId = response.headers['x-request-id'];
        throw new UpApiHttpError({
          message: `Up API HTTP ${response.status} for ${options.method} ${response.url}`,
          status: response.status,
          method: options.method,
          url: response.url,
          data: parsedError.success ? parsedError.data : responseBody,
          ...(requestId ? { requestId } : {}),
          responseHeaders: response.headers,
        });
      }

      const parsedResult = options.responseSchema.parse(responseBody) as TResponse;
      if (options.method === 'GET' && options.processPaginationLinks) {
        this.applyPaginationLinkFunctions(parsedResult, options.responseSchema);
      }

      if (options.method !== 'GET') {
        await this.queryClient.invalidateQueries({ queryKey: ['up', 'GET'] });
      }

      return parsedResult;
    }

    throw new Error('Unreachable request retry state');
  }

  /**
   * Performs the actual fetch call and returns normalized HTTP metadata.
   */
  private async executeHttpRequest(options: {
    method: HttpMethod;
    requestPath: string;
    payload?: unknown;
    accessToken: string;
  }): Promise<{
    ok: boolean;
    status: number;
    url: string;
    text: string;
    headers: Record<string, string>;
  }> {
    const requestUrl = new URL(options.requestPath, this.baseUrl);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
    };

    const init: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.payload !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.payload);
    }

    const response = await this.fetchImpl(requestUrl, init);
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      ok: response.ok,
      status: response.status,
      url: requestUrl.toString(),
      text: await response.text(),
      headers: responseHeaders,
    };
  }

  /**
   * Resolves access token from explicit API key or configured token provider.
   */
  private async resolveAccessToken(): Promise<string> {
    if (this.explicitApiKey != null) {
      return this.explicitApiKey;
    }

    if (this.tokenProvider) {
      const token = await this.tokenProvider();
      if (token) {
        return token;
      }
    }

    throw new Error(
      'No access token available. Provide apiKey, call updateApiKey(), or configure tokenProvider.',
    );
  }

  /**
   * Updates auth identity hash and clears GET cache when identity changes.
   *
   * @param accessToken Current access token, if available.
   */
  private syncAuthIdentity(accessToken: string | null): void {
    const nextIdentity =
      accessToken === null ? 'anonymous' : `token:${fingerprintToken(accessToken)}`;
    if (nextIdentity === this.authIdentity) {
      return;
    }

    this.authIdentity = nextIdentity;
    this.queryClient.removeQueries({ queryKey: ['up', 'GET'] });
  }

  /**
   * Rewrites pagination links to lazy fetcher functions.
   */
  private applyPaginationLinkFunctions<T>(
    responseData: T,
    responseSchema: UpResponseSchema<T>,
  ): void {
    if (!responseData || typeof responseData !== 'object') {
      return;
    }

    const candidate = responseData as {
      links?: {
        next?: string | null | (() => Promise<T>);
        prev?: string | null | (() => Promise<T>);
      };
    };

    if (!candidate.links || typeof candidate.links !== 'object') {
      return;
    }

    if (typeof candidate.links.next === 'string' || candidate.links.next === null) {
      candidate.links.next = this.processLink<T>(candidate.links.next, responseSchema);
    }

    if (typeof candidate.links.prev === 'string' || candidate.links.prev === null) {
      candidate.links.prev = this.processLink<T>(candidate.links.prev, responseSchema);
    }
  }
}

/**
 * Parses JSON text safely and falls back to raw text when parsing fails.
 */
function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Normalizes path by trimming leading slashes and rejecting empty values.
 */
function normalizePath(path: string): string {
  const normalized = path.replace(/^\/+/, '');
  if (!normalized) {
    throw new Error('path must not be empty');
  }
  return normalized;
}

/**
 * Maps an absolute link URL back to a client-relative request path.
 */
function toPathRelativeToBase(destinationUrl: URL, baseUrl: string): string {
  const basePathname = trimTrailingSlash(new URL(baseUrl).pathname);
  const destinationPathname = destinationUrl.pathname;

  const relativePathname =
    basePathname && destinationPathname.startsWith(basePathname)
      ? destinationPathname.slice(basePathname.length)
      : destinationPathname;

  const normalizedPathname = relativePathname.replace(/^\/+/, '');
  if (!normalizedPathname) {
    throw new Error(`Could not map pagination link to path: ${destinationUrl.toString()}`);
  }

  return `${normalizedPathname}${destinationUrl.search}`;
}

/**
 * Trims trailing slash characters from a pathname.
 */
function trimTrailingSlash(pathname: string): string {
  if (pathname === '/') {
    return '';
  }
  return pathname.replace(/\/+$/, '');
}

/**
 * Serializes query parameters into a URL query string.
 */
function serializeQueryParams(query: QueryParams | undefined): string {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item == null) continue;
        searchParams.append(key, String(item));
      }
      continue;
    }

    if (rawValue == null) {
      continue;
    }

    searchParams.append(key, String(rawValue));
  }

  return searchParams.toString();
}

/**
 * Produces a stable non-cryptographic token fingerprint for cache partitioning.
 */
function fingerprintToken(token: string): string {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return (hash >>> 0).toString(16);
}
