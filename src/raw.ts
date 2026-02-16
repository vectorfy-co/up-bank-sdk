import type { paths } from './gen/openapi';
import { operationSchemasByMethod } from './gen/operation-schemas';
import type { QueryParams } from './helper/client';
import { UpClient } from './helper/client';
import type { z } from 'zod';

/**
 * Lowercase HTTP method keys used by generated OpenAPI path types.
 */
type HttpMethodKey = 'get' | 'post' | 'delete' | 'patch';

type PathKey = keyof paths;

type PathWithMethod<Method extends HttpMethodKey> = {
  [Path in PathKey]: paths[Path][Method] extends Record<string, unknown> ? Path : never;
}[PathKey];

type Operation<Path extends PathKey, Method extends HttpMethodKey> = Extract<
  paths[Path][Method],
  Record<string, unknown>
>;

type ParametersOf<Op> = Op extends { parameters: infer Value } ? Value : never;
type PathParamsOf<Op> = ParametersOf<Op> extends { path?: infer Value } ? Value : never;
type QueryOf<Op> = ParametersOf<Op> extends { query?: infer Value } ? Value : never;
type BodyOf<Op> = Op extends {
  requestBody?: {
    content: { 'application/json': infer Value };
  };
}
  ? Value
  : never;

type PathOption<Op> = [PathParamsOf<Op>] extends [never]
  ? { path?: undefined }
  : { path: PathParamsOf<Op> };
type QueryOption<Op> = [QueryOf<Op>] extends [never]
  ? { query?: undefined }
  : { query?: QueryOf<Op> };
type BodyOption<Op> = [BodyOf<Op>] extends [never] ? { body?: undefined } : { body: BodyOf<Op> };

type GetOptions<Path extends PathWithMethod<'get'>> = PathOption<Operation<Path, 'get'>> &
  QueryOption<Operation<Path, 'get'>>;

type MutationOptions<Path extends PathWithMethod<'post'>, Method extends 'post'> = PathOption<
  Operation<Path, Method>
> &
  QueryOption<Operation<Path, Method>> &
  BodyOption<Operation<Path, Method>>;

type DeleteOptions<Path extends PathWithMethod<'delete'>> = PathOption<Operation<Path, 'delete'>> &
  QueryOption<Operation<Path, 'delete'>> &
  BodyOption<Operation<Path, 'delete'>>;

type PatchOptions<Path extends PathWithMethod<'patch'>> = PathOption<Operation<Path, 'patch'>> &
  QueryOption<Operation<Path, 'patch'>> &
  BodyOption<Operation<Path, 'patch'>>;

type RequiredKeys<T> = {
  [Key in keyof T]-?: Record<never, never> extends Pick<T, Key> ? never : Key;
}[keyof T];
type OperationSchemaMap = typeof operationSchemasByMethod;
type SchemaPathForMethod<Method extends keyof OperationSchemaMap> =
  keyof OperationSchemaMap[Method] & string;
type SchemaResponseSchema<
  Method extends keyof OperationSchemaMap,
  Path extends SchemaPathForMethod<Method>,
> = OperationSchemaMap[Method][Path] extends { responseSchema: infer TSchema } ? TSchema : never;
type SchemaResponse<
  Method extends keyof OperationSchemaMap,
  Path extends SchemaPathForMethod<Method>,
> = z.infer<SchemaResponseSchema<Method, Path>>;

/**
 * Produces an optional tuple when all properties are optional.
 */
type OptionsTuple<T> = [RequiredKeys<T>] extends [never] ? [options?: T] : [options: T];

/**
 * Raw typed API client generated from OpenAPI paths. This layer gives strict path/query/body typing
 * with minimal abstractions for power users.
 */
export class UpRawApi {
  /**
   * Creates a raw typed API wrapper around the shared low-level client.
   *
   * @param client Internal Up client.
   */
  constructor(private readonly client: UpClient) {}

  /**
   * Executes a typed GET operation by path template.
   *
   * @param path OpenAPI path template.
   * @param options Optional typed path/query parameters.
   * @returns Parsed response payload for the operation.
   */
  public async get<Path extends PathWithMethod<'get'> & SchemaPathForMethod<'GET'>>(
    path: Path,
    ...[options]: OptionsTuple<GetOptions<Path>>
  ): Promise<SchemaResponse<'GET', Path>> {
    const normalizedPath = normalizePathTemplate(path as string) as Path;
    const schemas = pickSchemaEntry(operationSchemasByMethod.GET, normalizedPath);
    if (!schemas) {
      throw new Error(`No operation schema mapping found for GET ${String(path)}`);
    }

    const resolvedPath = interpolatePath(normalizedPath, asRecord(options?.path));

    return await this.client.request({
      method: 'GET',
      path: resolvedPath,
      responseSchema: schemas.responseSchema,
      errorSchema: schemas.errorSchema,
      query: toQueryParams(options?.query),
      processPaginationLinks: false,
      cache: true,
      cacheKeyParts: [normalizedPath, options?.path ?? null, options?.query ?? null],
    });
  }

  /**
   * Executes a typed POST operation by path template.
   *
   * @param path OpenAPI path template.
   * @param options Typed path/query/body parameters.
   * @returns Parsed response payload for the operation.
   */
  public async post<Path extends PathWithMethod<'post'> & SchemaPathForMethod<'POST'>>(
    path: Path,
    ...[options]: OptionsTuple<MutationOptions<Path, 'post'>>
  ): Promise<SchemaResponse<'POST', Path>> {
    const normalizedPath = normalizePathTemplate(path as string) as Path;
    const schemas = pickSchemaEntry(operationSchemasByMethod.POST, normalizedPath);
    if (!schemas) {
      throw new Error(`No operation schema mapping found for POST ${String(path)}`);
    }

    const resolvedOptions = (options ?? {}) as MutationOptions<Path, 'post'>;
    const resolvedPath = interpolatePath(normalizedPath, asRecord(resolvedOptions.path));

    return await this.client.request({
      method: 'POST',
      path: resolvedPath,
      responseSchema: schemas.responseSchema,
      errorSchema: schemas.errorSchema,
      query: toQueryParams(resolvedOptions.query),
      payload: resolvedOptions.body,
      processPaginationLinks: false,
      cache: false,
    });
  }

  /**
   * Executes a typed DELETE operation by path template.
   *
   * @param path OpenAPI path template.
   * @param options Typed path/query/body parameters.
   * @returns Parsed response payload for the operation.
   */
  public async delete<Path extends PathWithMethod<'delete'> & SchemaPathForMethod<'DELETE'>>(
    path: Path,
    ...[options]: OptionsTuple<DeleteOptions<Path>>
  ): Promise<SchemaResponse<'DELETE', Path>> {
    const normalizedPath = normalizePathTemplate(path as string) as Path;
    const schemas = pickSchemaEntry(operationSchemasByMethod.DELETE, normalizedPath);
    if (!schemas) {
      throw new Error(`No operation schema mapping found for DELETE ${String(path)}`);
    }

    const resolvedOptions = (options ?? {}) as DeleteOptions<Path>;
    const resolvedPath = interpolatePath(normalizedPath, asRecord(resolvedOptions.path));

    return await this.client.request({
      method: 'DELETE',
      path: resolvedPath,
      responseSchema: schemas.responseSchema,
      errorSchema: schemas.errorSchema,
      query: toQueryParams(resolvedOptions.query),
      payload: resolvedOptions.body,
      processPaginationLinks: false,
      cache: false,
    });
  }

  /**
   * Executes a typed PATCH operation by path template.
   *
   * @param path OpenAPI path template.
   * @param options Typed path/query/body parameters.
   * @returns Parsed response payload for the operation.
   */
  public async patch<Path extends PathWithMethod<'patch'> & SchemaPathForMethod<'PATCH'>>(
    path: Path,
    ...[options]: OptionsTuple<PatchOptions<Path>>
  ): Promise<SchemaResponse<'PATCH', Path>> {
    const normalizedPath = normalizePathTemplate(path as string) as Path;
    const schemas = pickSchemaEntry(operationSchemasByMethod.PATCH, normalizedPath);
    if (!schemas) {
      throw new Error(`No operation schema mapping found for PATCH ${String(path)}`);
    }

    const resolvedOptions = (options ?? {}) as PatchOptions<Path>;
    const resolvedPath = interpolatePath(normalizedPath, asRecord(resolvedOptions.path));

    return await this.client.request({
      method: 'PATCH',
      path: resolvedPath,
      responseSchema: schemas.responseSchema,
      errorSchema: schemas.errorSchema,
      query: toQueryParams(resolvedOptions.query),
      payload: resolvedOptions.body,
      processPaginationLinks: false,
      cache: false,
    });
  }
}

/**
 * Replaces `{param}` placeholders with encoded values.
 *
 * @param pathTemplate Path template from OpenAPI.
 * @param pathParams Named path parameters.
 * @returns Interpolated relative path without leading slash.
 */
function interpolatePath(pathTemplate: string, pathParams?: Record<string, unknown>): string {
  const resolved = pathTemplate.replace(/\{([^}]+)\}/g, (_, key: string) => {
    if (!pathParams || !(key in pathParams)) {
      throw new Error(`Missing required path parameter: ${key}`);
    }

    const value = pathParams[key];
    if (value === undefined || value === null) {
      throw new Error(`Path parameter ${key} cannot be null or undefined`);
    }

    return encodeURIComponent(String(value));
  });

  return resolved.replace(/^\/+/, '');
}

function normalizePathTemplate(pathTemplate: string): string {
  const trimmed = pathTemplate.trim();
  if (trimmed === '') {
    return '';
  }

  const withoutEdges = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return `/${withoutEdges}`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Path parameters must be an object when provided');
  }

  return value as Record<string, unknown>;
}

function toQueryParams(value: unknown): QueryParams | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Query parameters must be an object when provided');
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const query: Record<string, QueryParams[string]> = {};

  for (const [key, raw] of entries) {
    if (Array.isArray(raw)) {
      if (!raw.every((item) => isQueryParamPrimitive(item))) {
        throw new Error(`Unsupported query array value for key ${key}`);
      }
      query[key] = raw;
      continue;
    }

    if (!isQueryParamPrimitive(raw)) {
      throw new Error(`Unsupported query value for key ${key}`);
    }
    query[key] = raw;
  }

  return query;
}

function isQueryParamPrimitive(
  value: unknown,
): value is string | number | boolean | null | undefined {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  );
}

function pickSchemaEntry<
  TEntries extends Record<string, { responseSchema: z.ZodTypeAny; errorSchema: z.ZodTypeAny }>,
  TPath extends keyof TEntries & string,
>(entries: TEntries, path: TPath): TEntries[TPath] | undefined {
  if (!(path in entries)) {
    return undefined;
  }

  return entries[path];
}
