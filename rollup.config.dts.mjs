import dts from 'rollup-plugin-dts';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default /** @type {import('rollup').RollupOptions} */ ({
  input: 'src/index.ts',
  output: [{ file: pkg.types, format: 'es' }],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  plugins: [dts({ tsconfig: './tsconfig.build.json' })],
});
