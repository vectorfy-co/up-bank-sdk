import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const OPENAPI_URL =
  'https://raw.githubusercontent.com/up-banking/api/refs/heads/master/v1/openapi.json';
const OPENAPI_SPEC_FILE = process.env.OPENAPI_SPEC_FILE;
const OPENAPI_SPEC_URL = process.env.OPENAPI_SPEC_URL ?? OPENAPI_URL;
const OPENAPI_SPEC_SHA256 = process.env.OPENAPI_SPEC_SHA256;

type OpenApiResponse = Record<string, unknown>;
type OpenApiSpec = {
  components?: {
    schemas?: OpenApiResponse;
  };
  paths?: Record<string, Record<string, OpenApiResponse>>;
};

type OpenApiOperation = {
  responses?: Record<
    string,
    {
      content?: {
        'application/json'?: {
          schema?: OpenApiResponse;
        };
      };
    }
  >;
};

type RegistryOperation = {
  method: string;
  pathTemplate: string;
  key: string;
  responseSchemaName: string;
};

function run(cmd: string, args: ReadonlyArray<string>): void {
  const res = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function getExpectedChecksum(): string | undefined {
  return OPENAPI_SPEC_SHA256 ? OPENAPI_SPEC_SHA256.trim().toLowerCase() : undefined;
}

function verifyOpenApiChecksum(specText: string, sourceLabel: string): void {
  const expected = getExpectedChecksum();
  if (!expected) {
    return;
  }

  const actual = createHash('sha256').update(specText).digest('hex');
  if (actual !== expected) {
    throw new Error(
      `OpenAPI checksum mismatch for ${sourceLabel}: expected ${expected}, received ${actual}`,
    );
  }
}

function resolveSpecPath(): string {
  return OPENAPI_SPEC_FILE
    ? path.resolve(repoRoot, OPENAPI_SPEC_FILE)
    : path.join(repoRoot, 'openapi', 'up.openapi.json');
}

async function loadOpenApiSpecText(): Promise<string> {
  if (OPENAPI_SPEC_FILE) {
    const specPath = resolveSpecPath();
    const specText = readFileSync(specPath, 'utf8');
    verifyOpenApiChecksum(specText, specPath);
    return specText;
  }

  const specResponse = await fetch(OPENAPI_SPEC_URL);
  if (!specResponse.ok) {
    throw new Error(
      `Failed to download OpenAPI spec from ${OPENAPI_SPEC_URL}: ${specResponse.status} ${specResponse.statusText}`,
    );
  }

  const specText = await specResponse.text();
  verifyOpenApiChecksum(specText, OPENAPI_SPEC_URL);
  return specText;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hardenGeneratedEnumSchemas(spec: OpenApiSpec, schemasPath: string): void {
  let content = readFileSync(schemasPath, 'utf8');
  const schemaEntries = Object.entries(spec.components?.schemas ?? {});

  for (const [schemaName, schema] of schemaEntries) {
    if (!schema || typeof schema !== 'object') {
      continue;
    }

    const enumValues = (schema as { enum?: unknown[] }).enum;
    if (!Array.isArray(enumValues) || enumValues.length === 0) {
      continue;
    }

    if (!enumValues.every((item) => typeof item === 'string')) {
      continue;
    }

    const enumValuesLiteral = JSON.stringify(enumValues);
    const enumPattern = new RegExp(
      `const\\s+${escapeRegExp(schemaName)}\\s*=\\s*z\\.unknown\\(\\);`,
      'g',
    );
    content = content.replace(enumPattern, `const ${schemaName} = z.enum(${enumValuesLiteral});`);
  }

  const unresolvedEnumMatches = [...content.matchAll(/const\s+(\w+Enum)\s*=\s*z\.unknown\(\);/g)];
  if (unresolvedEnumMatches.length > 0) {
    const unresolvedNames = unresolvedEnumMatches
      .map((match) => match[1])
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `Enum hardening failed; unresolved enum placeholders remain: ${unresolvedNames}`,
    );
  }

  writeFileSync(schemasPath, content, 'utf8');
}

function normalizePathTemplate(pathTemplate: string): string {
  const trimmed = pathTemplate.trim();
  if (trimmed === '') {
    return '';
  }

  const withoutEdges = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  return `/${withoutEdges}`;
}

function generateOperationSchemaRegistry(spec: OpenApiSpec, outputPath: string): void {
  const operationEntries: RegistryOperation[] = [];
  const schemaImports = new Set<string>(['ErrorResponseSchema']);
  const methodNames = ['get', 'post', 'delete', 'patch'];

  for (const [pathTemplate, pathConfig] of Object.entries(spec.paths ?? {})) {
    const normalizedPathTemplate = normalizePathTemplate(pathTemplate);
    if (normalizedPathTemplate === '') {
      continue;
    }

    if (!pathConfig || typeof pathConfig !== 'object') {
      continue;
    }

    for (const method of methodNames) {
      const operation = pathConfig?.[method];
      if (!operation || typeof operation !== 'object') {
        continue;
      }

      const success = resolveSuccessSchemaName(operation as OpenApiOperation, pathTemplate, method);
      if (success.responseSchemaName !== 'EmptyResponseSchema') {
        schemaImports.add(success.responseSchemaName);
      }

      operationEntries.push({
        method: method.toUpperCase(),
        pathTemplate: normalizedPathTemplate,
        key: `${method.toUpperCase()} ${normalizedPathTemplate}`,
        responseSchemaName: success.responseSchemaName,
      });
    }
  }

  operationEntries.sort((left, right) => left.key.localeCompare(right.key));
  const sortedImports = [...schemaImports].sort((left, right) => left.localeCompare(right));
  const operationEntriesByMethod = operationEntries.reduce((acc, entry) => {
    const existing = acc.get(entry.method) ?? [];
    existing.push(entry);
    acc.set(entry.method, existing);
    return acc;
  }, new Map<string, RegistryOperation[]>());
  const sortedMethods = [...operationEntriesByMethod.keys()].sort((left, right) =>
    left.localeCompare(right),
  );

  const lines = [
    '/**',
    ' * This file is auto-generated by scripts/generate.mts.',
    ' * Do not edit directly.',
    ' */',
    '',
    'import type { ZodTypeAny } from "zod";',
    'import { z } from "zod";',
    `import { ${sortedImports.join(', ')} } from "./schemas";`,
    '',
    'export type OperationSchemaEntry = {',
    '  readonly responseSchema: ZodTypeAny;',
    '  readonly errorSchema: ZodTypeAny;',
    '};',
    '',
    'const EmptyResponseSchema = z.null().transform(() => undefined);',
    '',
    'const OPERATION_SCHEMAS = {',
    ...operationEntries.map(
      (entry) =>
        `  ${JSON.stringify(entry.key)}: { responseSchema: ${entry.responseSchemaName}, errorSchema: ErrorResponseSchema },`,
    ),
    '} as const;',
    '',
    'const OPERATION_SCHEMAS_BY_METHOD = {',
    ...sortedMethods.flatMap((method) => {
      const entriesForMethod = operationEntriesByMethod.get(method) ?? [];
      return [
        `  ${JSON.stringify(method)}: {`,
        ...entriesForMethod.map(
          (entry) =>
            `    ${JSON.stringify(entry.pathTemplate)}: { responseSchema: ${entry.responseSchemaName}, errorSchema: ErrorResponseSchema },`,
        ),
        '  },',
      ];
    }),
    '} as const;',
    '',
    'function normalizePathTemplate(pathTemplate: string): string {',
    '  const trimmed = pathTemplate.trim();',
    '  if (trimmed === "") {',
    '    return "";',
    '  }',
    '  const withoutEdges = trimmed',
    '    .replace(new RegExp("^/+", "u"), "")',
    '    .replace(new RegExp("/+$", "u"), "");',
    '  return `/${withoutEdges}`;',
    '}',
    '',
    'export const operationSchemas = OPERATION_SCHEMAS;',
    'export const operationSchemasByMethod = OPERATION_SCHEMAS_BY_METHOD;',
    '',
    'export function getOperationSchemas<',
    '  TMethod extends keyof typeof OPERATION_SCHEMAS_BY_METHOD,',
    '  TPath extends keyof (typeof OPERATION_SCHEMAS_BY_METHOD)[TMethod] & string,',
    '>(',
    '  method: TMethod,',
    '  pathTemplate: TPath,',
    '): (typeof OPERATION_SCHEMAS_BY_METHOD)[TMethod][TPath];',
    'export function getOperationSchemas(',
    '  method: string,',
    '  pathTemplate: string,',
    '): OperationSchemaEntry | undefined;',
    'export function getOperationSchemas(',
    '  method: string,',
    '  pathTemplate: string,',
    '): OperationSchemaEntry | undefined {',
    '  const normalizedMethod = method.toUpperCase();',
    '  const normalizedPath = normalizePathTemplate(pathTemplate);',
    '  const methodEntries = OPERATION_SCHEMAS_BY_METHOD[',
    '    normalizedMethod as keyof typeof OPERATION_SCHEMAS_BY_METHOD',
    '  ];',
    '  if (!methodEntries) {',
    '    return undefined;',
    '  }',
    '  return methodEntries[normalizedPath as keyof typeof methodEntries];',
    '}',
    '',
  ];

  writeFileSync(outputPath, lines.join('\n'), 'utf8');
}

function resolveSuccessSchemaName(
  operation: OpenApiOperation,
  pathTemplate: string,
  method: string,
): { responseSchemaName: string } {
  const responses = operation.responses ?? {};
  const responseEntries = Object.entries(responses);
  const preferredStatuses = ['200', '201', '202', '204'];
  const selectedResponseEntry =
    preferredStatuses
      .map((status) => [status, responses[status]])
      .find(([, value]) => value != null) ??
    responseEntries.find(([status]) => /^2\d\d$/.test(status));

  if (!selectedResponseEntry) {
    throw new Error(`Missing success response for ${method.toUpperCase()} ${pathTemplate}`);
  }

  const [statusCode, response] = selectedResponseEntry;
  if (statusCode === '204') {
    return { responseSchemaName: 'EmptyResponseSchema' };
  }

  if (typeof response !== 'object' || response === null) {
    throw new Error(`Unsupported response definition for ${method.toUpperCase()} ${pathTemplate}`);
  }

  const responseBody = response as {
    content?: {
      'application/json'?: {
        schema?: OpenApiResponse;
      };
    };
  };
  const mediaSchema = responseBody?.content?.['application/json']?.schema;
  if (!mediaSchema) {
    return { responseSchemaName: 'EmptyResponseSchema' };
  }

  const schemaRef = mediaSchema.$ref;
  if (!schemaRef || typeof schemaRef !== 'string') {
    throw new Error(
      `Unsupported non-$ref success schema for ${method.toUpperCase()} ${pathTemplate}`,
    );
  }

  const schemaName = schemaRef.replace('#/components/schemas/', '');
  return { responseSchemaName: `${schemaName}Schema` };
}

async function main(): Promise<void> {
  const specText = await loadOpenApiSpecText();
  const spec = JSON.parse(specText) as OpenApiSpec;

  mkdirSync(path.join(repoRoot, 'openapi'), { recursive: true });
  mkdirSync(path.join(repoRoot, 'src', 'gen'), { recursive: true });

  const specPath = path.join(repoRoot, 'openapi', 'up.openapi.json');
  writeFileSync(specPath, specText, 'utf8');

  run('pnpm', [
    'exec',
    'openapi-typescript',
    specPath,
    '-o',
    path.join('src', 'gen', 'openapi.ts'),
    '--export-type',
    '--immutable',
  ]);

  run('pnpm', [
    'exec',
    'openapi-zod-client',
    specPath,
    '--export-schemas',
    '--template',
    path.join('scripts', 'openapi-zod-templates', 'schemas-only.hbs'),
    '-o',
    path.join('src', 'gen', 'schemas.ts'),
  ]);

  const schemasPath = path.join(repoRoot, 'src', 'gen', 'schemas.ts');
  hardenGeneratedEnumSchemas(spec, schemasPath);

  const operationSchemasPath = path.join(repoRoot, 'src', 'gen', 'operation-schemas.ts');
  generateOperationSchemaRegistry(spec, operationSchemasPath);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
