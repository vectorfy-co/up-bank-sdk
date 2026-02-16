import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(cmd: string, args: ReadonlyArray<string>): void {
  const res = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

rmSync(path.join(repoRoot, 'dist'), { recursive: true, force: true });
run('pnpm', ['exec', 'rollup', '-c', 'rollup.config.mjs', '-w']);
