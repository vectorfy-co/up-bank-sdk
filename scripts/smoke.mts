import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(cmd: string, args: ReadonlyArray<string>, cwd: string = repoRoot): string {
  const res = spawnSync(cmd, args, {
    cwd,
    env: process.env,
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (res.status !== 0) {
    process.stderr.write(res.stdout ?? '');
    process.stderr.write(res.stderr ?? '');
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }

  return `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();
}

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function findPackedTarball(packOutput: string): string {
  const lines = packOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const tarballName = [...lines].reverse().find((line) => line.endsWith('.tgz'));
  if (!tarballName) {
    throw new Error(`Could not detect packed tarball name from output:\n${packOutput}`);
  }
  return path.join(repoRoot, tarballName);
}

function main(): void {
  const smokeRoot = mkdtempSync(path.join(tmpdir(), 'up-bank-sdk-smoke-'));

  try {
    run('pnpm', ['build'], repoRoot);
    const packOutput = run('pnpm', ['pack']);
    const tarballPath = findPackedTarball(packOutput);

    writeJson(path.join(smokeRoot, 'package.json'), {
      name: 'up-bank-sdk-smoke',
      private: true,
      type: 'module',
      version: '1.0.0',
    });

    run(
      'pnpm',
      [
        'add',
        '--config.node-linker=hoisted',
        tarballPath,
        'react@19.2.0',
        'react-dom@19.2.0',
        '@tanstack/react-query@5.90.20',
      ],
      smokeRoot,
    );

    const esmCheckPath = path.join(smokeRoot, 'esm-check.mjs');
    writeFileSync(
      esmCheckPath,
      [
        "import { UpApi, UpRawApi } from '@vectorfyco/up-bank-sdk';",
        "import { usePing, upQueryKeys } from '@vectorfyco/up-bank-sdk/react';",
        '',
        "if (typeof UpApi !== 'function' || typeof UpRawApi !== 'function') {",
        "  throw new Error('Core ESM exports are not valid constructors');",
        '}',
        "if (typeof usePing !== 'function') {",
        "  throw new Error('React ESM exports are missing usePing');",
        '}',
        'if (!Array.isArray(upQueryKeys.util.ping())) {',
        "  throw new Error('React ESM query key export is invalid');",
        '}',
      ].join('\n'),
      'utf8',
    );
    run('node', [esmCheckPath], smokeRoot);

    const cjsCheckPath = path.join(smokeRoot, 'cjs-check.cjs');
    writeFileSync(
      cjsCheckPath,
      [
        "const core = require('@vectorfyco/up-bank-sdk');",
        "const reactExports = require('@vectorfyco/up-bank-sdk/react');",
        '',
        "if (typeof core.UpApi !== 'function' || typeof core.UpRawApi !== 'function') {",
        "  throw new Error('Core CJS exports are not valid constructors');",
        '}',
        "if (typeof reactExports.usePing !== 'function') {",
        "  throw new Error('React CJS exports are missing usePing');",
        '}',
        'if (!Array.isArray(reactExports.upQueryKeys.util.ping())) {',
        "  throw new Error('React CJS query key export is invalid');",
        '}',
      ].join('\n'),
      'utf8',
    );
    run('node', [cjsCheckPath], smokeRoot);

    rmSync(tarballPath, { force: true });
    process.stdout.write('Smoke tests passed for packed ESM/CJS core and react exports.\n');
  } finally {
    rmSync(smokeRoot, { recursive: true, force: true });
  }
}

main();
