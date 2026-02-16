# ![@vectorfyco/up-bank-sdk](https://img.shields.io/static/v1?label=&message=%40vectorfyco%2Fup-bank-sdk&color=1D4ED8&style=for-the-badge&logo=typescript&logoColor=white)

TypeScript SDK for the [Up API](https://developer.up.com.au/) with an ergonomic client, generated OpenAPI types, and always-on runtime response validation.

<div align="left">
  <table>
    <tr>
      <td><strong>Lifecycle</strong></td>
      <td>
        <a href="https://github.com/vectorfy-co/up-bank-sdk/actions/workflows/ci.yaml"><img src="https://img.shields.io/github/actions/workflow/status/vectorfy-co/up-bank-sdk/ci.yaml?style=flat&logo=githubactions&logoColor=white" alt="CI badge" /></a>
        <a href="https://www.npmjs.com/package/@vectorfyco/up-bank-sdk"><img src="https://img.shields.io/npm/v/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=npm&logoColor=white" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@vectorfyco/up-bank-sdk"><img src="https://img.shields.io/npm/dt/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=npm&logoColor=white" alt="npm downloads" /></a>
        <a href="https://github.com/vectorfy-co/up-bank-sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/%40vectorfyco%2Fup-bank-sdk?style=flat&logo=opensourceinitiative&logoColor=white" alt="license" /></a>
      </td>
    </tr>
    <tr>
      <td><strong>Core Stack</strong></td>
      <td>
        <img src="https://img.shields.io/badge/TypeScript-ESM-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
        <img src="https://img.shields.io/badge/Transport-fetch-111827?style=flat&logo=javascript&logoColor=white" alt="fetch transport" />
        <img src="https://img.shields.io/badge/OpenAPI-generated-6BA539?style=flat&logo=openapiinitiative&logoColor=white" alt="OpenAPI" />
        <img src="https://img.shields.io/badge/Zod-runtime%20validation-3E67B1?style=flat&logo=zod&logoColor=white" alt="Zod" />
        <img src="https://img.shields.io/badge/TanStack%20Query-core%20cache-FF4154?style=flat&logo=tanstack&logoColor=white" alt="TanStack Query" />
        <img src="https://img.shields.io/badge/pnpm-workspace%20scripts-F69220?style=flat&logo=pnpm&logoColor=white" alt="pnpm" />
      </td>
    </tr>
    <tr>
      <td><strong>Navigation</strong></td>
      <td>
        <a href="#install"><img src="https://img.shields.io/badge/Package-Install-059669?style=flat&logo=pnpm&logoColor=white" alt="Install" /></a>
        <a href="#quick-start"><img src="https://img.shields.io/badge/Local%20Setup-Quick%20Start-16A34A?style=flat&logo=serverless&logoColor=white" alt="Quick start" /></a>
        <a href="#features"><img src="https://img.shields.io/badge/Overview-Features-7C3AED?style=flat&logo=simpleicons&logoColor=white" alt="Features" /></a>
        <a href="#configuration"><img src="https://img.shields.io/badge/Client-Configuration-0EA5E9?style=flat&logo=codeclimate&logoColor=white" alt="Configuration" /></a>
        <a href="#react-query-hooks"><img src="https://img.shields.io/badge/React-Query%20Hooks-2563EB?style=flat&logo=react&logoColor=white" alt="React Query hooks" /></a>
        <a href="#ci-cd"><img src="https://img.shields.io/badge/Release-CI%2FCD-1F4B99?style=flat&logo=githubactions&logoColor=white" alt="CI/CD" /></a>
        <a href="#troubleshooting"><img src="https://img.shields.io/badge/Help-Troubleshooting-0F172A?style=flat&logo=serverfault&logoColor=white" alt="Troubleshooting" /></a>
      </td>
    </tr>
  </table>
</div>

<a id="install"></a>

## ![Install](https://img.shields.io/badge/Install-pnpm-059669?style=for-the-badge&logo=pnpm&logoColor=white)

```bash
pnpm add @vectorfyco/up-bank-sdk
```

<a id="quick-start"></a>

## ![Quick Start](https://img.shields.io/badge/Quick%20Start-2%20calls-16A34A?style=for-the-badge&logo=serverless&logoColor=white)

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi('up:your:token');

const ping = await up.util.ping();
const accounts = await up.accounts.list({ pageSize: 20 });
```

<a id="features"></a>

## ![Features](https://img.shields.io/badge/Features-SDK%20highlights-7C3AED?style=for-the-badge&logo=simpleicons&logoColor=white)

| Feature Badge                                                                                                               | Details                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ![Ergonomic](https://img.shields.io/badge/Client-ergonomic-1D4ED8?style=flat&logo=typescript&logoColor=white)               | Class-based APIs (`up.accounts.list()`, `up.transactions.list()`, ...). |
| ![Attachments](https://img.shields.io/badge/Attachments-first%20class-111827?style=flat&logo=files&logoColor=white)         | `up.attachments.*` endpoints treated as first-class APIs.               |
| ![OpenAPI](https://img.shields.io/badge/OpenAPI-generated%20types-6BA539?style=flat&logo=openapiinitiative&logoColor=white) | Generated artifacts are the source of truth.                            |
| ![Validation](https://img.shields.io/badge/Validation-always%20on-3E67B1?style=flat&logo=zod&logoColor=white)               | Every response is parsed via generated Zod schemas before returning.    |
| ![Raw](https://img.shields.io/badge/Raw-typed%20operations-0EA5E9?style=flat&logo=codeclimate&logoColor=white)              | Low-level `up.raw.*` with typed path/query/payload scaffolding.         |
| ![React](https://img.shields.io/badge/React-Query%20hooks-2563EB?style=flat&logo=react&logoColor=white)                     | Hooks via `@vectorfyco/up-bank-sdk/react` (TanStack Query).             |
| ![Fetch](https://img.shields.io/badge/Transport-fetch-111827?style=flat&logo=javascript&logoColor=white)                    | Uses `fetch`; no Axios dependency.                                      |
| ![Cache](https://img.shields.io/badge/Cache-Query%20Core-FF4154?style=flat&logo=tanstack&logoColor=white)                   | GET caching via TanStack Query Core (configurable).                     |
| ![Webhooks](https://img.shields.io/badge/Webhooks-signature%20helpers-0F172A?style=flat&logo=serverfault&logoColor=white)   | Verify and parse webhook callbacks with constant-time signature checks. |

<a id="configuration"></a>

## ![Configuration](https://img.shields.io/badge/Configuration-Client%20options-0EA5E9?style=for-the-badge&logo=codeclimate&logoColor=white)

The SDK does not require any environment variables. Examples may use `process.env.UP_ACCESS_TOKEN` for convenience.

| Setting            | Type                                | Default                         | Notes                                                                  |
| ------------------ | ----------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| `apiKey`           | `string` (or `null`)                | `null`                          | Static bearer token (equivalent to passing a string to `new UpApi()`). |
| `tokenProvider`    | `() => string` (or async string)    | `undefined`                     | Resolve an access token at request time.                               |
| `retryOn401`       | `boolean`                           | `true`                          | Retry after a 401 (useful with a rotating `tokenProvider`).            |
| `maxAuthRetries`   | `number`                            | `1`                             | Maximum auth retry attempts for a 401 response.                        |
| `onAuthError`      | `(context) => void` (or async void) | `undefined`                     | Called after 401 responses (attempt metadata, method, url, status).    |
| `baseUrl`          | `string`                            | `https://api.up.com.au/api/v1/` | Override the Up API base URL (advanced use).                           |
| `fetch`            | `typeof fetch`                      | global `fetch`                  | Provide a custom `fetch` implementation (Node/browser/polyfill).       |
| `queryClient`      | `QueryClient`                       | internal client                 | Supply your own TanStack Query Core client for cache control.          |
| `enableQueryCache` | `boolean`                           | `true`                          | Enables GET request caching via TanStack Query Core.                   |

### Auth lifecycle (token provider)

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi({
  tokenProvider: async () => process.env.UP_ACCESS_TOKEN ?? '',
  retryOn401: true,
  maxAuthRetries: 1,
  onAuthError: async ({ method, url, status, attempt, maxRetries }) => {
    console.warn('Auth failed', { method, url, status, attempt, maxRetries });
  },
});
```

<a id="runtime-validation"></a>

## ![Runtime Validation](https://img.shields.io/badge/Runtime%20Validation-always%20on-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

Every API response is parsed through generated Zod schemas before being returned.

- Valid payloads: returned as typed data.
- Invalid payloads: throw immediately (schema validation error).
- Non-2xx payloads: wrapped in `UpApiHttpError` with parsed error body when possible.

<a id="zod-and-types"></a>

## ![Zod And Types](https://img.shields.io/badge/Zod%20%26%20Types-generated%20schemas-6BA539?style=for-the-badge&logo=openapiinitiative&logoColor=white)

```ts
import type { ListTransactionsResponse } from '@vectorfyco/up-bank-sdk';
import { ListTransactionsResponseSchema } from '@vectorfyco/up-bank-sdk';

const payload: unknown = await fetch('/something').then((r) => r.json());
const parsed = ListTransactionsResponseSchema.parse(payload);
```

<a id="raw-operations"></a>

## ![Raw Typed Operations](https://img.shields.io/badge/Raw-typed%20operations-0EA5E9?style=for-the-badge&logo=codeclimate&logoColor=white)

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';

const up = new UpApi('up:your:token');

const transactions = await up.raw.get('/transactions', {
  query: { 'page[size]': 10 },
});

const account = await up.raw.get('/accounts/{id}', {
  path: { id: '7699cfe5-eabd-4855-bbe7-9dfe3f70cebf' },
});
```

<a id="react-query-hooks"></a>

## ![React Query Hooks](https://img.shields.io/badge/React-Query%20hooks-2563EB?style=for-the-badge&logo=react&logoColor=white)

Install peer dependencies in your app:

```bash
pnpm add @tanstack/react-query react react-dom
```

Use hooks from `@vectorfyco/up-bank-sdk/react`:

```ts
import { UpApi } from '@vectorfyco/up-bank-sdk';
import { useAccountsList, useCreateWebhook } from '@vectorfyco/up-bank-sdk/react';

const up = new UpApi('up:your:token');

function Example() {
  const accounts = useAccountsList(up, { pageSize: 10 });
  const createWebhook = useCreateWebhook(up);

  // createWebhook.mutate({ url: 'https://example.com/webhook' })
  return null;
}
```

<a id="webhooks"></a>

## ![Webhooks](https://img.shields.io/badge/Webhooks-security%20helpers-0F172A?style=for-the-badge&logo=serverfault&logoColor=white)

Verify and parse webhook callbacks:

```ts
import { assertVerifiedWebhookEvent } from '@vectorfyco/up-bank-sdk';

const event = await assertVerifiedWebhookEvent({
  rawBody,
  signatureHeader,
  secretKey,
});
```

<a id="error-handling"></a>

## ![Error Handling](https://img.shields.io/badge/Error%20Handling-UpApiHttpError-DC2626?style=for-the-badge&logo=datadog&logoColor=white)

```ts
import { isUpApiError, isUpApiHttpError } from '@vectorfyco/up-bank-sdk';
```

`UpApiHttpError` includes `status`, `method`, `url`, `data`, `requestId`, and `responseHeaders`.

<a id="why-no-interfaces"></a>

## ![Why No Interfaces](https://img.shields.io/badge/Why%20No%20Interfaces-v3%20contract%20source-111827?style=for-the-badge&logo=openapiinitiative&logoColor=white)

Legacy hand-written `src/**/interfaces.ts` files were removed intentionally. They drifted from upstream API contracts.

In v3, the contract hierarchy is:

1. `openapi/up.openapi.json`
1. Generated artifacts in `src/gen/*`
1. SDK aliases in `src/types.ts`

<a id="migration"></a>

## ![Migration](https://img.shields.io/badge/Migration-v2%20to%20v3-111827?style=for-the-badge&logo=git&logoColor=white)

### Breaking changes

- Legacy manual `interfaces.ts` modules were removed.
- Runtime response validation is always enabled.
- `UpClient` low-level methods now require response schemas.
- Webhook `ping` returns `WebhookEventCallback`.

### Import migration

```ts
// Old: hand-maintained contract copied into app code (legacy pattern)
type LegacyListAccountsResponse = {
  data: unknown[];
  links?: unknown;
};

const legacyPayload = (await fetch('/api/legacy').then((response) =>
  response.json(),
)) as LegacyListAccountsResponse;

// New: imported from generated SDK contracts
import type { ListAccountsResponse } from '@vectorfyco/up-bank-sdk';
import { UpApi } from '@vectorfyco/up-bank-sdk';

const sdkPayload = (await up.accounts.list()) as ListAccountsResponse;
```

### React hooks

```ts
import { useTransactionsList } from '@vectorfyco/up-bank-sdk/react';
```

<a id="developer-workflow"></a>

## ![Developer Workflow](https://img.shields.io/badge/Developer-commands-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

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

<a id="ci-cd"></a>

## ![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-1F4B99?style=for-the-badge&logo=githubactions&logoColor=white)

Workflows:

- CI: `.github/workflows/ci.yaml`
- Publish: `.github/workflows/publish.yaml`
- Release helper: `.github/workflows/release.yaml`
- Dependabot auto-merge: `.github/workflows/dependabot-auto-merge.yaml`
- Dependency updates: `.github/dependabot.yml`

NPM publish prerequisites:

- Add an `NPM_TOKEN` secret for npm authentication.
- If using `environment: npm-publish`, configure required reviewers in repository settings.
- Configure branch protection on `main` to require successful CI before merging.
- Use semver tags (`vX.Y.Z`) for publish-triggered releases.

Release flow options:

- Tag-driven: push a `vX.Y.Z` tag to trigger `.github/workflows/publish.yaml`.
- Manual publish: use `workflow_dispatch` on the publish workflow with a tag input.
- Release workflow: `.github/workflows/release.yaml` can route from CI completion when a matching semver tag exists on the commit.

<a id="architecture"></a>

## ![Architecture](https://img.shields.io/badge/Architecture-OpenAPI%20to%20SDK-111827?style=for-the-badge&logo=openapiinitiative&logoColor=white)

Contract pipeline:

1. `openapi/up.openapi.json`
1. Generated artifacts in `src/gen/*` (types + Zod schemas)
1. SDK aliases in `src/types.ts` and `src/zod.ts`

Design notes:

- Validation is always enabled (schemas are generated from the OpenAPI contract).
- GET endpoints can be cached via TanStack Query Core (disable with `enableQueryCache: false` if needed).
- Pagination links (`links.next`/`links.prev`) are transformed into callable functions on GET responses when applicable.

<a id="troubleshooting"></a>

## ![Troubleshooting](https://img.shields.io/badge/Troubleshooting-common%20issues-0F172A?style=for-the-badge&logo=serverfault&logoColor=white)

- Schema validation failures: upstream response shape changed or unexpected payload received; inspect the thrown Zod error details.
- Webhook signature mismatch: ensure raw body bytes are unmodified before verification; verify the secret key matches the webhook configuration.
- 401 loops: ensure the token provider returns an updated token after `onAuthError`.
- Pagination links: `links.next` / `links.prev` are callable functions (not raw URLs) in ergonomic GET responses.
