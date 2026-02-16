# ![@vectorfyco/up-bank-sdk](https://img.shields.io/static/v1?label=&message=%40vectorfyco%2Fup-bank-sdk&color=1D4ED8&style=for-the-badge&logo=typescript&logoColor=white)

TypeScript SDK for the [Up API](https://developer.up.com.au/) with generated OpenAPI contracts, runtime Zod validation, ergonomic resource clients, and an optional React Query integration.

<div align="left">
  <table>
    <tr>
      <td><strong>Lifecycle</strong></td>
      <td>
        <a href="https://github.com/vectorfy-co/up-bank-sdk/actions/workflows/ci.yaml"><img src="https://img.shields.io/github/actions/workflow/status/vectorfy-co/up-bank-sdk/ci.yaml?style=flat&logo=githubactions&logoColor=white" alt="CI" /></a>
        <a href="https://www.npmjs.com/package/@vectorfyco/up-bank-sdk"><img src="https://img.shields.io/npm/v/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=npm&logoColor=white" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@vectorfyco/up-bank-sdk"><img src="https://img.shields.io/npm/dt/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=npm&logoColor=white" alt="npm downloads" /></a>
        <a href="https://www.npmjs.com/package/@vectorfyco/up-bank-sdk"><img src="https://img.shields.io/npm/l/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=opensourceinitiative&logoColor=white" alt="License" /></a>
      </td>
    </tr>
    <tr>
      <td><strong>Core Stack</strong></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript-ESM%20%2B%20CJS-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
        <img src="https://img.shields.io/badge/OpenAPI-generated%20contracts-6BA539?style=flat&logo=openapiinitiative&logoColor=white" alt="OpenAPI" />
        <img src="https://img.shields.io/badge/Zod-runtime%20validation-3E67B1?style=flat&logo=zod&logoColor=white" alt="Zod" />
        <img src="https://img.shields.io/badge/TanStack-Query%20Core-FF4154?style=flat&logo=tanstack&logoColor=white" alt="TanStack Query" />
        <img src="https://img.shields.io/badge/React-optional%20hooks-2563EB?style=flat&logo=react&logoColor=white" alt="React" />
        <img src="https://img.shields.io/badge/pnpm-tooling-F69220?style=flat&logo=pnpm&logoColor=white" alt="pnpm" />
      </td>
    </tr>
    <tr>
      <td><strong>Navigation</strong></td>
      <td>
        <a href="#quick-start"><img src="https://img.shields.io/badge/Local%20Setup-Quick%20Start-16A34A?style=flat&logo=serverless&logoColor=white" alt="Quick Start" /></a>
        <a href="#api-surface"><img src="https://img.shields.io/badge/API-Surface-7C3AED?style=flat&logo=simpleicons&logoColor=white" alt="API Surface" /></a>
        <a href="#configuration"><img src="https://img.shields.io/badge/Client-Configuration-0EA5E9?style=flat&logo=codeclimate&logoColor=white" alt="Configuration" /></a>
        <a href="#auth--error-handling"><img src="https://img.shields.io/badge/Auth%20%26%20Errors-Runtime-DC2626?style=flat&logo=serverfault&logoColor=white" alt="Auth and Error Handling" /></a>
        <a href="#react-query-hooks"><img src="https://img.shields.io/badge/React-Query%20Hooks-2563EB?style=flat&logo=react&logoColor=white" alt="React Query Hooks" /></a>
        <a href="#ci-cd--release"><img src="https://img.shields.io/badge/Release-CI%2FCD-1F4B99?style=flat&logo=githubactions&logoColor=white" alt="CI/CD" /></a>
        <a href="#architecture"><img src="https://img.shields.io/badge/Design-Architecture-111827?style=flat&logo=openapiinitiative&logoColor=white" alt="Architecture" /></a>
        <a href="#troubleshooting"><img src="https://img.shields.io/badge/Help-Troubleshooting-0F172A?style=flat&logo=serverfault&logoColor=white" alt="Troubleshooting" /></a>
      </td>
    </tr>
  </table>
</div>

<a id="quick-start"></a>

## ![Quick Start](https://img.shields.io/badge/Quick%20Start-pnpm-16A34A?style=for-the-badge&logo=pnpm&logoColor=white)

Prerequisites:

- Node.js LTS (CI uses `lts/*`)
- `pnpm` (repo `packageManager` is `pnpm@10.26.1`)

Install and first call:

```bash
pnpm add @vectorfyco/up-bank-sdk
```

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi('up:your:token');

const ping = await up.util.ping();
const accounts = await up.accounts.list({ pageSize: 20 });
```

<a id="features"></a>

## ![Feature Highlights](https://img.shields.io/badge/Feature%20Highlights-validated%20SDK-7C3AED?style=for-the-badge&logo=simpleicons&logoColor=white)

| Feature Badge                                                                                                              | Details                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ![Ergonomic](https://img.shields.io/badge/Ergonomic-Resource%20clients-1D4ED8?style=flat&logo=typescript&logoColor=white)  | Namespace clients: `accounts`, `categories`, `attachments`, `transactions`, `tags`, `webhooks`, `util`. |
| ![Raw](https://img.shields.io/badge/Raw-typed%20operations-0EA5E9?style=flat&logo=codeclimate&logoColor=white)             | `up.raw.get/post/patch/delete` is typed from generated OpenAPI path/parameter definitions.              |
| ![Validation](https://img.shields.io/badge/Validation-always%20on-3E67B1?style=flat&logo=zod&logoColor=white)              | Every response is parsed through generated Zod schemas.                                                 |
| ![Caching](https://img.shields.io/badge/Caching-GET%20Query%20Core-FF4154?style=flat&logo=tanstack&logoColor=white)        | GET caching uses TanStack Query Core and is partitioned by token identity fingerprint.                  |
| ![Pagination](https://img.shields.io/badge/Pagination-callable%20links-111827?style=flat&logo=serverfault&logoColor=white) | Ergonomic GET calls convert `links.next/prev` URLs into callable functions.                             |
| ![Hooks](https://img.shields.io/badge/React-optional%20hooks-2563EB?style=flat&logo=react&logoColor=white)                 | Optional `@vectorfyco/up-bank-sdk/react` hooks with scoped query keys and mutation invalidation.        |
| ![Webhooks](https://img.shields.io/badge/Webhooks-HMAC%20helpers-0F172A?style=flat&logo=serverfault&logoColor=white)       | Verify signatures and parse events with `assertVerifiedWebhookEvent`.                                   |

<a id="api-surface"></a>

## ![API Surface](https://img.shields.io/badge/API%20Surface-generated%20map-7C3AED?style=for-the-badge&logo=openapiinitiative&logoColor=white)

Ergonomic namespace clients:

| Namespace         | Methods                                                     |
| ----------------- | ----------------------------------------------------------- |
| `up.accounts`     | `list`, `retrieve`                                          |
| `up.categories`   | `list`, `retrieve`, `updateTransactionCategory`             |
| `up.attachments`  | `list`, `get`                                               |
| `up.transactions` | `list`, `retrieve`, `listByAccount`                         |
| `up.tags`         | `list`, `addTagsToTransaction`, `removeTagsFromTransaction` |
| `up.webhooks`     | `list`, `create`, `retrieve`, `delete`, `ping`, `listLogs`  |
| `up.util`         | `ping`                                                      |
| `up.raw`          | `get`, `post`, `patch`, `delete`                            |

Generated operation coverage (`src/gen/operation-schemas.ts`):

| Method   | Path                                                   |
| -------- | ------------------------------------------------------ |
| `GET`    | `/util/ping`                                           |
| `GET`    | `/accounts`                                            |
| `GET`    | `/accounts/{id}`                                       |
| `GET`    | `/accounts/{accountId}/transactions`                   |
| `GET`    | `/attachments`                                         |
| `GET`    | `/attachments/{id}`                                    |
| `GET`    | `/categories`                                          |
| `GET`    | `/categories/{id}`                                     |
| `GET`    | `/tags`                                                |
| `GET`    | `/transactions`                                        |
| `GET`    | `/transactions/{id}`                                   |
| `GET`    | `/webhooks`                                            |
| `GET`    | `/webhooks/{id}`                                       |
| `GET`    | `/webhooks/{webhookId}/logs`                           |
| `POST`   | `/webhooks`                                            |
| `POST`   | `/webhooks/{webhookId}/ping`                           |
| `POST`   | `/transactions/{transactionId}/relationships/tags`     |
| `PATCH`  | `/transactions/{transactionId}/relationships/category` |
| `DELETE` | `/webhooks/{id}`                                       |
| `DELETE` | `/transactions/{transactionId}/relationships/tags`     |

<a id="configuration"></a>

## ![Configuration](https://img.shields.io/badge/Configuration-UpClient%20options-0EA5E9?style=for-the-badge&logo=codeclimate&logoColor=white)

Runtime configuration (`UpClientOptions`):

| Option             | Type                                 | Default                         | Purpose                                      |
| ------------------ | ------------------------------------ | ------------------------------- | -------------------------------------------- |
| `apiKey`           | `string \| null`                     | `null`                          | Static bearer token.                         |
| `tokenProvider`    | `() => string \| Promise<string>`    | `undefined`                     | Per-request token resolution.                |
| `retryOn401`       | `boolean`                            | `true`                          | Enables retry flow after 401 responses.      |
| `maxAuthRetries`   | `number`                             | `1`                             | Number of retry attempts after auth failure. |
| `onAuthError`      | `(context) => void \| Promise<void>` | `undefined`                     | Hook invoked before retrying after 401.      |
| `baseUrl`          | `string`                             | `https://api.up.com.au/api/v1/` | API base URL override.                       |
| `fetch`            | `typeof fetch`                       | global `fetch`                  | Custom fetch implementation.                 |
| `queryClient`      | `QueryClient`                        | internal client                 | Override Query Core cache instance.          |
| `enableQueryCache` | `boolean`                            | `true`                          | Toggle internal GET caching behavior.        |

Environment variables:

| Variable              | Required | Description                                                                                |
| --------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `UP_ACCESS_TOKEN`     | No       | Optional pattern for your app-side `tokenProvider`; not consumed automatically by the SDK. |
| `OPENAPI_SPEC_FILE`   | No       | Used by `pnpm generate`; load spec from a local file instead of URL.                       |
| `OPENAPI_SPEC_URL`    | No       | Used by `pnpm generate`; override source OpenAPI URL.                                      |
| `OPENAPI_SPEC_SHA256` | No       | Used by `pnpm generate`; enforce spec checksum verification.                               |

<a id="auth--error-handling"></a>

## ![Auth And Error Handling](https://img.shields.io/badge/Auth%20%26%20Error%20Handling-validated%20flow-DC2626?style=for-the-badge&logo=serverfault&logoColor=white)

Token lifecycle sample:

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi({
  tokenProvider: async () => process.env.UP_ACCESS_TOKEN ?? '',
  retryOn401: true,
  maxAuthRetries: 1,
  onAuthError: async ({ attempt, maxRetries, method, url, status }) => {
    console.warn('Up auth error', { attempt, maxRetries, method, url, status });
  },
});
```

Error model:

- HTTP failures throw `UpApiHttpError` (includes `status`, `method`, `url`, `data`, `requestId`, `responseHeaders`).
- SDK helper `isUpApiHttpError` narrows transport-level failures.
- SDK helper `isUpApiError` checks that `error.response.data` matches Up's structured error schema.
- Schema mismatches on successful HTTP responses throw Zod validation errors immediately.

<a id="runtime-validation"></a>

## ![Runtime Validation](https://img.shields.io/badge/Runtime%20Validation-Zod%20enforced-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

Validation pipeline:

1. Up API responses are parsed as JSON (or raw text fallback on malformed JSON errors).
2. Success payloads are validated via generated response schemas.
3. Error payloads are validated via generated `ErrorResponseSchema` (or custom error schema if supplied).
4. For GET requests, optional pagination links are converted into lazy functions that call back through the same schema.

Schema/type imports:

```ts
import type { ListTransactionsResponse } from '@vectorfyco/up-bank-sdk';
import { ListTransactionsResponseSchema } from '@vectorfyco/up-bank-sdk';
```

<a id="caching--pagination"></a>

## ![Caching And Pagination](https://img.shields.io/badge/Caching%20%26%20Pagination-Query%20Core-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)

Caching behavior:

- GET requests are cached by default (`enableQueryCache: true`).
- Cache keys include method, auth identity fingerprint, request path/query, and optional custom parts.
- Mutation success (`POST`, `PATCH`, `DELETE`) invalidates SDK-managed GET cache keys.
- When auth identity changes, cached GET queries are cleared.

Pagination behavior:

- Ergonomic GET calls rewrite `links.next` and `links.prev` into functions.
- Calling one of those functions fetches the next/previous page and validates it with the same schema.
- Raw operations (`up.raw.*`) intentionally keep pagination links as raw values (`processPaginationLinks: false`).

<a id="raw-typed-operations"></a>

## ![Raw Typed Operations](https://img.shields.io/badge/Raw%20Operations-OpenAPI%20typed-0EA5E9?style=for-the-badge&logo=openapiinitiative&logoColor=white)

`up.raw` is useful when you want strict typing by OpenAPI path template with minimal abstraction.

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi('up:your:token');

const ping = await up.raw.get('/util/ping');

const accountTransactions = await up.raw.get('/accounts/{accountId}/transactions', {
  path: { accountId: 'account-123' },
  query: { 'page[size]': 10 },
});

await up.raw.patch('/transactions/{transactionId}/relationships/category', {
  path: { transactionId: 'txn-1' },
  body: { data: { type: 'categories', id: 'cat-1' } },
});
```

<a id="react-query-hooks"></a>

## ![React Query Hooks](https://img.shields.io/badge/React%20Query-Hooks-2563EB?style=for-the-badge&logo=react&logoColor=white)

Install peers for hook usage:

```bash
pnpm add @tanstack/react-query react react-dom
```

Read hooks (`@vectorfyco/up-bank-sdk/react`):

- `usePing`
- `useAccountsList`, `useAccount`
- `useCategoriesList`, `useCategory`
- `useTransactionsList`, `useAccountTransactions`, `useTransaction`
- `useTagsList`
- `useWebhooksList`, `useWebhook`, `useWebhookLogs`

Mutation hooks:

- `useUpdateTransactionCategory`
- `useAddTransactionTags`, `useRemoveTransactionTags`
- `useCreateWebhook`, `useDeleteWebhook`, `usePingWebhook`

Hook semantics:

- Read hooks disable SDK internal GET cache per call (`{ cache: false }`) and rely on React Query for caching.
- Query keys are scoped (`upQueryKeys.scope(scopeKey)`), default scope is `default`.
- Mutation hooks invalidate all keys in the selected scope on success.

<a id="webhook-security"></a>

## ![Webhook Security](https://img.shields.io/badge/Webhook%20Security-HMAC%20SHA--256-0F172A?style=for-the-badge&logo=serverfault&logoColor=white)

Helpers:

- `verifyWebhookSignature({ rawBody, signatureHeader, secretKey })`
- `parseAndValidateWebhookEvent(rawBody)`
- `assertVerifiedWebhookEvent({ rawBody, signatureHeader, secretKey })`

Validation notes:

- Signature comparison is constant-time.
- Header values accept raw hex or `sha256=<hex>` format (case-insensitive, trimmed).
- Works with Web Crypto; falls back to `node:crypto` when Web Crypto is unavailable.
- `rawBody` must be unmodified payload bytes/text from the request.

<a id="developer-workflow"></a>

## ![Developer Workflow](https://img.shields.io/badge/Developer%20Workflow-scripts-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

Primary commands:

```bash
pnpm generate
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm test
pnpm test:coverage
pnpm build
pnpm test:smoke
```

What each command does:

| Command              | Purpose                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm generate`      | Downloads or loads the Up OpenAPI spec, regenerates `src/gen/openapi.ts`, `src/gen/schemas.ts`, and operation registry mappings. |
| `pnpm build`         | Clears `dist` and emits ESM/CJS bundles plus `.d.ts` for core and React entrypoints via Rollup.                                  |
| `pnpm dev`           | Watch-mode Rollup build for the core entrypoint.                                                                                 |
| `pnpm test`          | Runs Vitest suite.                                                                                                               |
| `pnpm test:coverage` | Runs coverage with 95% thresholds for branches/functions/lines/statements.                                                       |
| `pnpm test:smoke`    | Packs the package and validates ESM/CJS imports for core and React exports in a temp project.                                    |

<a id="ci-cd--release"></a>

## ![CI/CD And Release](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-1F4B99?style=for-the-badge&logo=githubactions&logoColor=white)

Workflows:

- CI: `.github/workflows/ci.yaml`
- Publish: `.github/workflows/publish.yaml`
- Release Bump bridge: `.github/workflows/release.yaml`
- Dependabot auto-merge: `.github/workflows/dependabot-auto-merge.yaml`

CI (`main` push + pull requests):

1. Install dependencies with frozen lockfile.
2. Lint, format check, typecheck.
3. Run tests and coverage.
4. Build package.

Publish behavior:

- Triggered by semver tags `vX.Y.Z`, manual dispatch, or workflow call.
- Validates tag shape before publish.
- Publishes with `npm publish --access public --provenance`.
- Creates a GitHub release for the published tag.

Required repository secrets/settings:

| Item                              | Required          | Purpose                                     |
| --------------------------------- | ----------------- | ------------------------------------------- |
| `NPM_TOKEN`                       | Yes (for publish) | npm authentication during publish workflow. |
| Branch protection on `main`       | Recommended       | Ensure CI passes before merge.              |
| npm publish environment reviewers | Optional          | Add manual controls for release governance. |

<a id="architecture"></a>

## ![Architecture](https://img.shields.io/badge/Architecture-contract--first-111827?style=for-the-badge&logo=openapiinitiative&logoColor=white)

Source-of-truth chain:

1. `openapi/up.openapi.json`
2. Generated API typings (`src/gen/openapi.ts`)
3. Generated Zod schemas (`src/gen/schemas.ts`)
4. Generated operation schema registry (`src/gen/operation-schemas.ts`)
5. Public aliases and wrappers (`src/types.ts`, `src/zod.ts`, `src/index.ts`, `src/raw.ts`, `src/react/*`)

Package outputs:

- Core: `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts`
- React entrypoint: `dist/react/index.mjs`, `dist/react/index.cjs`, `dist/react/index.d.ts`

Design decisions reflected in code/tests:

- Runtime validation is mandatory for success and error responses.
- GET cache is token-identity aware.
- Mutations invalidate GET cache.
- Raw layer enforces path/query/body shape at runtime in addition to compile-time typing.

<a id="operations"></a>

## ![Operations](https://img.shields.io/badge/Operations-runtime%20checks-0F172A?style=for-the-badge&logo=serverfault&logoColor=white)

Operational checks you can wire into your app:

- Connectivity/auth probe: `up.util.ping()`.
- Webhook verification gate: `assertVerifiedWebhookEvent(...)` before processing payload.
- Error observability: log `UpApiHttpError.status`, `requestId`, and `data` for incident triage.

<a id="troubleshooting"></a>

## ![Troubleshooting](https://img.shields.io/badge/Troubleshooting-common%20failures-0F172A?style=for-the-badge&logo=serverfault&logoColor=white)

- `No access token available`:
  - Pass `apiKey`, call `updateApiKey()`, or configure `tokenProvider`.
- Repeated 401 responses:
  - Ensure `tokenProvider` returns a refreshed token after `onAuthError`.
  - Confirm `maxAuthRetries` and `retryOn401` settings.
- Zod parse errors on success responses:
  - Upstream payload shape changed or endpoint response differs from expected contract.
  - Regenerate contracts with `pnpm generate` and review diffs.
- Webhook signature mismatches:
  - Use raw request body bytes, not parsed/reshaped JSON.
  - Verify your webhook secret and header forwarding behavior.
- Unexpected cache behavior:
  - For direct SDK usage, set `cache: false` per call when you want no internal GET cache.
  - For React hooks, cache is handled by React Query, not SDK internal cache.

<a id="notes"></a>

## ![Notes](https://img.shields.io/badge/Notes-security%20and%20contracts-111827?style=for-the-badge&logo=git&logoColor=white)

- Do not commit API tokens or webhook secrets.
- Regenerated files in `src/gen/*` are derived artifacts; treat them as generated source.
- The package license in `package.json` is `ISC`.
